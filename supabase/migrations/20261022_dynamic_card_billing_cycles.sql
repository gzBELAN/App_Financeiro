-- App Financeiro — ciclos dinâmicos de cartão.
-- Execute manualmente após 20261022_update_installment_purchase_full.sql.
-- Ajusta vencimentos para fins de semana e feriados nacionais fixos.

begin;

alter table public.credit_cards
  add column if not exists closing_days_before_due smallint not null default 8
  check (closing_days_before_due between 1 and 31);

alter table public.installment_purchases
  add column if not exists first_installment_invoice_adjustment smallint not null default 0
  check (first_installment_invoice_adjustment between -1 and 1);

create or replace function public.is_brazil_national_holiday(p_date date)
returns boolean
language sql
immutable
set search_path = public
as $$
  select to_char(p_date, 'MM-DD') in ('01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25');
$$;

create or replace function public.next_brazil_business_day(p_date date)
returns date
language plpgsql
immutable
set search_path = public
as $$
declare v_date date := p_date;
begin
  while extract(isodow from v_date) in (6, 7) or public.is_brazil_national_holiday(v_date) loop
    v_date := v_date + 1;
  end loop;
  return v_date;
end;
$$;

-- Determina o vencimento da fatura: vencimento nominal ajustado para o próximo
-- dia útil; fechamento é N dias corridos antes do dia nominal de vencimento.
-- Exemplo: vencimento no dia 5 e fechamento 8 dias antes resulta no dia 27
-- em um mês anterior de 30 dias e no dia 28 em um mês anterior de 31 dias.
create or replace function public.invoice_due_date(
  p_occurred_on date,
  p_closing_day smallint,
  p_due_day smallint
)
returns date
language plpgsql
immutable
set search_path = public
as $$
declare
  v_due_month date := (date_trunc('month', p_occurred_on)::date + interval '1 month')::date;
  v_due_date date;
  v_closing_date date;
  v_effective_due_day smallint;
begin
  -- Os nomes dos parâmetros são mantidos para substituir a função legada sem
  -- removê-la. Na regra dinâmica, o segundo argumento é o dia de vencimento
  -- e o terceiro é a quantidade de dias até o fechamento.
  v_effective_due_day := least(p_closing_day, extract(day from (v_due_month + interval '1 month - 1 day'))::smallint);
  v_due_date := public.next_brazil_business_day(make_date(
    extract(year from v_due_month)::integer,
    extract(month from v_due_month)::integer,
    v_effective_due_day
  ));
  v_closing_date := case
    when v_effective_due_day > p_due_day then make_date(
      extract(year from v_due_month)::integer,
      extract(month from v_due_month)::integer,
      v_effective_due_day - p_due_day
    )
    else (
      date_trunc('month', v_due_month)::date - 1
      + (v_effective_due_day - p_due_day)
    )::date
  end;

  if p_occurred_on <= v_closing_date then
    return v_due_date;
  end if;

  v_due_month := (v_due_month + interval '1 month')::date;
  return public.next_brazil_business_day(make_date(
    extract(year from v_due_month)::integer,
    extract(month from v_due_month)::integer,
    least(p_closing_day, extract(day from (v_due_month + interval '1 month - 1 day'))::integer)
  ));
end;
$$;

create or replace view public.credit_card_invoice_items
with (security_invoker = true)
as
select e.id as entry_id, e.user_id, e.credit_card_id, c.name as credit_card_name,
  e.description, e.amount_cents, e.occurred_on, e.status,
  e.installment_number, e.installment_count,
  public.invoice_due_date(e.occurred_on, c.due_day, c.closing_days_before_due) as due_date,
  e.workspace_id, p.purchase_date
from public.financial_entries e
join public.credit_cards c on c.id = e.credit_card_id and c.workspace_id = e.workspace_id
left join public.installment_purchases p on p.id = e.installment_purchase_id and p.workspace_id = e.workspace_id
where e.kind = 'expense' and e.payment_method = 'credit_card' and e.status <> 'cancelled';

-- Assinaturas no cartão também usam o vencimento dinâmico para o status da cobrança.
create or replace function public.generate_recurring_entries(p_rule_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_rule public.recurring_rules%rowtype;
  v_months integer;
  v_period date;
  v_date date;
  v_due_date date;
  v_due_day smallint;
  v_closing_days smallint;
  v_created integer := 0;
begin
  select * into v_rule
  from public.recurring_rules
  where id = p_rule_id and public.can_edit_workspace(workspace_id) and is_active;

  if not found then raise exception 'Recurring rule not found or editor permission is required'; end if;
  if v_rule.payment_method = 'credit_card' then
    select due_day, closing_days_before_due into v_due_day, v_closing_days
    from public.credit_cards
    where id = v_rule.credit_card_id and workspace_id = v_rule.workspace_id and is_active;
    if not found then raise exception 'Credit card not found'; end if;
  end if;

  v_months := case v_rule.frequency when 'monthly' then 1 when 'quarterly' then 3 when 'semiannual' then 6 when 'annual' then 12 end;
  v_period := date_trunc('month', v_rule.starts_on)::date;
  while v_period <= date_trunc('month', v_rule.generate_until)::date loop
    v_date := make_date(extract(year from v_period)::integer, extract(month from v_period)::integer, least(v_rule.billing_day, extract(day from (v_period + interval '1 month - 1 day'))::integer));
    if v_date >= v_rule.starts_on and v_date <= v_rule.generate_until and (v_rule.ends_on is null or v_date <= v_rule.ends_on) then
      v_due_date := case when v_rule.payment_method = 'credit_card' then public.invoice_due_date(v_date, v_due_day, v_closing_days) else null end;
      insert into public.financial_entries (workspace_id, created_by_id, user_id, kind, description, amount_cents, occurred_on, category_id, payment_method, credit_card_id, recurring_rule_id, status, notes)
      values (v_rule.workspace_id, v_rule.created_by_id, v_rule.user_id, 'expense', v_rule.description, v_rule.amount_cents, v_date, v_rule.category_id, v_rule.payment_method, v_rule.credit_card_id, v_rule.id, case when v_due_date is not null and v_due_date < current_date then 'paid'::public.entry_status else 'pending'::public.entry_status end, v_rule.notes)
      on conflict (recurring_rule_id, occurred_on) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;
    v_period := (v_period + make_interval(months => v_months))::date;
  end loop;
  return v_created;
end;
$$;

drop function if exists public.create_installment_purchase(text, bigint, smallint, date, uuid, uuid, text, uuid);
create or replace function public.create_installment_purchase(
  p_description text, p_total_amount_cents bigint, p_installment_count smallint,
  p_purchase_date date, p_credit_card_id uuid, p_category_id uuid default null,
  p_notes text default null, p_workspace_id uuid default null,
  p_first_installment_invoice_adjustment smallint default 0
)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_actor_id uuid := auth.uid(); v_purchase_id uuid; v_base_amount bigint; v_remainder bigint;
  v_number smallint; v_month date; v_date date; v_entry_date date; v_due_date date;
  v_due_day smallint; v_closing_days smallint;
begin
  if not public.can_edit_workspace(p_workspace_id) then raise exception 'Editor permission is required'; end if;
  if p_total_amount_cents <= 0 or p_installment_count not between 2 and 360 then raise exception 'Invalid installment values'; end if;
  if p_first_installment_invoice_adjustment not between -1 and 1 then raise exception 'Invalid first installment invoice adjustment'; end if;
  select due_day, closing_days_before_due into v_due_day, v_closing_days from public.credit_cards where id = p_credit_card_id and workspace_id = p_workspace_id and is_active;
  if not found then raise exception 'Credit card not found'; end if;
  if p_category_id is not null and not exists (select 1 from public.categories where id = p_category_id and workspace_id = p_workspace_id) then raise exception 'Category not found'; end if;
  insert into public.installment_purchases (workspace_id, created_by_id, user_id, credit_card_id, category_id, description, total_amount_cents, installment_count, purchase_date, notes, first_installment_invoice_adjustment)
  values (p_workspace_id, v_actor_id, v_actor_id, p_credit_card_id, p_category_id, trim(p_description), p_total_amount_cents, p_installment_count, p_purchase_date, nullif(trim(p_notes), ''), p_first_installment_invoice_adjustment) returning id into v_purchase_id;
  v_base_amount := p_total_amount_cents / p_installment_count; v_remainder := p_total_amount_cents % p_installment_count;
  for v_number in 1..p_installment_count loop
    v_month := (date_trunc('month', p_purchase_date)::date + ((v_number - 1) * interval '1 month'))::date;
    v_date := make_date(extract(year from v_month)::integer, extract(month from v_month)::integer, least(extract(day from p_purchase_date)::integer, extract(day from (v_month + interval '1 month - 1 day'))::integer));
    v_entry_date := case when v_number = 1 then (v_date + make_interval(months => p_first_installment_invoice_adjustment))::date else v_date end;
    v_due_date := public.invoice_due_date(v_entry_date, v_due_day, v_closing_days);
    insert into public.financial_entries (workspace_id, created_by_id, user_id, kind, description, amount_cents, occurred_on, category_id, payment_method, credit_card_id, installment_purchase_id, installment_number, installment_count, status, notes)
    values (p_workspace_id, v_actor_id, v_actor_id, 'expense', trim(p_description), v_base_amount + case when v_number <= v_remainder then 1 else 0 end, v_entry_date, p_category_id, 'credit_card', p_credit_card_id, v_purchase_id, v_number, p_installment_count, case when v_due_date < current_date then 'paid'::public.entry_status else 'pending'::public.entry_status end, nullif(trim(p_notes), ''));
  end loop;
  return v_purchase_id;
end; $$;

drop function if exists public.update_installment_purchase(uuid, uuid, text, bigint, smallint, date, uuid, uuid, text);
create or replace function public.update_installment_purchase(
  p_workspace_id uuid, p_purchase_id uuid, p_description text, p_total_amount_cents bigint,
  p_installment_count smallint, p_purchase_date date, p_credit_card_id uuid,
  p_category_id uuid, p_notes text default null, p_first_installment_invoice_adjustment smallint default 0
)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_actor_id uuid := auth.uid(); v_base_amount bigint; v_remainder bigint; v_number smallint;
  v_month date; v_date date; v_entry_date date; v_due_date date; v_due_day smallint; v_closing_days smallint;
begin
  if not public.can_edit_workspace(p_workspace_id) then raise exception 'Editor permission is required'; end if;
  if not exists (select 1 from public.installment_purchases where id = p_purchase_id and workspace_id = p_workspace_id) then raise exception 'Installment purchase not found'; end if;
  if p_total_amount_cents <= 0 or p_installment_count not between 2 and 360 then raise exception 'Invalid installment values'; end if;
  if p_first_installment_invoice_adjustment not between -1 and 1 then raise exception 'Invalid first installment invoice adjustment'; end if;
  select due_day, closing_days_before_due into v_due_day, v_closing_days from public.credit_cards where id = p_credit_card_id and workspace_id = p_workspace_id and is_active;
  if not found then raise exception 'Credit card not found'; end if;
  if p_category_id is not null and not exists (select 1 from public.categories where id = p_category_id and workspace_id = p_workspace_id) then raise exception 'Category not found'; end if;
  delete from public.financial_entries where installment_purchase_id = p_purchase_id and workspace_id = p_workspace_id;
  update public.installment_purchases set description = trim(p_description), total_amount_cents = p_total_amount_cents,
    installment_count = p_installment_count, purchase_date = p_purchase_date, credit_card_id = p_credit_card_id,
    category_id = p_category_id, notes = nullif(trim(p_notes), ''), first_installment_invoice_adjustment = p_first_installment_invoice_adjustment
  where id = p_purchase_id and workspace_id = p_workspace_id;
  v_base_amount := p_total_amount_cents / p_installment_count; v_remainder := p_total_amount_cents % p_installment_count;
  for v_number in 1..p_installment_count loop
    v_month := (date_trunc('month', p_purchase_date)::date + ((v_number - 1) * interval '1 month'))::date;
    v_date := make_date(extract(year from v_month)::integer, extract(month from v_month)::integer, least(extract(day from p_purchase_date)::integer, extract(day from (v_month + interval '1 month - 1 day'))::integer));
    v_entry_date := case when v_number = 1 then (v_date + make_interval(months => p_first_installment_invoice_adjustment))::date else v_date end;
    v_due_date := public.invoice_due_date(v_entry_date, v_due_day, v_closing_days);
    insert into public.financial_entries (workspace_id, created_by_id, user_id, kind, description, amount_cents, occurred_on, category_id, payment_method, credit_card_id, installment_purchase_id, installment_number, installment_count, status, notes)
    values (p_workspace_id, v_actor_id, v_actor_id, 'expense', trim(p_description), v_base_amount + case when v_number <= v_remainder then 1 else 0 end, v_entry_date, p_category_id, 'credit_card', p_credit_card_id, p_purchase_id, v_number, p_installment_count, case when v_due_date < current_date then 'paid'::public.entry_status else 'pending'::public.entry_status end, nullif(trim(p_notes), ''));
  end loop;
end; $$;

-- Reclassifica todo o histórico ao alterar um ciclo do cartão.
create or replace function public.recalculate_credit_card_entry_statuses()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.due_day is distinct from old.due_day or new.closing_days_before_due is distinct from old.closing_days_before_due then
    update public.financial_entries e set status = case when public.invoice_due_date(e.occurred_on, new.due_day, new.closing_days_before_due) < current_date then 'paid'::public.entry_status else 'pending'::public.entry_status end
    where e.credit_card_id = new.id and e.workspace_id = new.workspace_id and e.status <> 'cancelled';
  end if;
  return new;
end; $$;
drop trigger if exists credit_cards_recalculate_entry_statuses on public.credit_cards;
create trigger credit_cards_recalculate_entry_statuses after update of due_day, closing_days_before_due on public.credit_cards for each row execute function public.recalculate_credit_card_entry_statuses();

-- Atualiza todo o histórico existente com a regra nova e configura a conversão inicial do fechamento antigo.
update public.credit_cards set closing_days_before_due = greatest(1, least(31, ((due_day - closing_day + 31) % 31))) where closing_days_before_due = 8;
update public.financial_entries e set status = case when public.invoice_due_date(e.occurred_on, c.due_day, c.closing_days_before_due) < current_date then 'paid'::public.entry_status else 'pending'::public.entry_status end
from public.credit_cards c where c.id = e.credit_card_id and c.workspace_id = e.workspace_id and e.status <> 'cancelled';

revoke all on function public.create_installment_purchase(text, bigint, smallint, date, uuid, uuid, text, uuid, smallint) from public;
grant execute on function public.create_installment_purchase(text, bigint, smallint, date, uuid, uuid, text, uuid, smallint) to authenticated;
revoke all on function public.update_installment_purchase(uuid, uuid, text, bigint, smallint, date, uuid, uuid, text, smallint) from public;
grant execute on function public.update_installment_purchase(uuid, uuid, text, bigint, smallint, date, uuid, uuid, text, smallint) to authenticated;

commit;