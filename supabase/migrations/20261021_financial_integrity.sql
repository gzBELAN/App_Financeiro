-- App Financeiro — garantias de integridade entre controles financeiros.
-- Execute após bank_accounts_and_salary.sql em um projeto Supabase novo.
-- Este arquivo não acessa serviços externos; sua execução é manual no SQL Editor.

begin;

-- A view original foi criada antes do suporte a controles compartilhados.
-- Inclui o contexto para permitir filtros explícitos sem quebrar RLS.
create or replace view public.credit_card_invoice_items
with (security_invoker = true)
as
select
  e.id as entry_id,
  e.user_id,
  e.credit_card_id,
  c.name as credit_card_name,
  e.description,
  e.amount_cents,
  e.occurred_on,
  e.status,
  e.installment_number,
  e.installment_count,
  public.invoice_due_date(e.occurred_on, c.closing_day, c.due_day) as due_date,
  e.workspace_id
from public.financial_entries e
join public.credit_cards c on c.id = e.credit_card_id and c.workspace_id = e.workspace_id
where e.kind = 'expense'
  and e.payment_method = 'credit_card'
  and e.status <> 'cancelled';

-- Garante que cada relacionamento de lançamento pertença ao mesmo controle financeiro.
create or replace function public.validate_financial_entry_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.categories where id = new.category_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Category must belong to the same financial workspace';
  end if;

  if new.credit_card_id is not null and not exists (
    select 1 from public.credit_cards where id = new.credit_card_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Credit card must belong to the same financial workspace';
  end if;

  if new.bank_account_id is not null and not exists (
    select 1 from public.bank_accounts where id = new.bank_account_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Bank account must belong to the same financial workspace';
  end if;

  if new.installment_purchase_id is not null and not exists (
    select 1 from public.installment_purchases where id = new.installment_purchase_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Installment purchase must belong to the same financial workspace';
  end if;

  if new.recurring_rule_id is not null and not exists (
    select 1 from public.recurring_rules where id = new.recurring_rule_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Recurring rule must belong to the same financial workspace';
  end if;

  return new;
end;
$$;

create or replace function public.validate_credit_card_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.bank_accounts where id = new.bank_account_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Bank account must belong to the same financial workspace';
  end if;

  return new;
end;
$$;

drop trigger if exists financial_entries_validate_workspace on public.financial_entries;
create trigger financial_entries_validate_workspace
before insert or update of workspace_id, category_id, credit_card_id, bank_account_id, installment_purchase_id, recurring_rule_id
on public.financial_entries
for each row execute function public.validate_financial_entry_workspace();

drop trigger if exists credit_cards_validate_workspace on public.credit_cards;
create trigger credit_cards_validate_workspace
before insert or update of workspace_id, bank_account_id
on public.credit_cards
for each row execute function public.validate_credit_card_workspace();

-- Evita que uma pessoa elimine o último controle a que ainda tem acesso.
create or replace function public.prevent_last_workspace_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.allow_last_workspace_deletion', true) is distinct from 'true'
    and old.owner_profile_id = auth.uid()
    and not exists (
    select 1
    from public.workspace_members
    where profile_id = auth.uid()
      and workspace_id <> old.id
    ) then
    raise exception 'Create or join another financial workspace before deleting the last accessible workspace';
  end if;

  return old;
end;
$$;

drop trigger if exists financial_workspaces_prevent_last_deletion on public.financial_workspaces;
create trigger financial_workspaces_prevent_last_deletion
before delete on public.financial_workspaces
for each row execute function public.prevent_last_workspace_deletion();

-- Mantém a exclusão da própria conta viável após a criação da proteção acima.
create or replace function public.delete_my_account_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if exists (
    select 1
    from public.financial_workspaces w
    where w.owner_profile_id = auth.uid()
      and exists (
        select 1 from public.workspace_members m
        where m.workspace_id = w.id and m.profile_id <> auth.uid()
      )
  ) then
    raise exception 'Transfer ownership or delete shared workspaces before deleting the account';
  end if;

  perform set_config('app.allow_last_workspace_deletion', 'true', true);
  delete from public.financial_workspaces where owner_profile_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$;

-- Índices para filtros operacionais do dashboard, relatórios e lançamentos.
create index if not exists financial_entries_workspace_status_occurred_on_idx
  on public.financial_entries (workspace_id, status, occurred_on desc);
create index if not exists financial_entries_workspace_category_occurred_on_idx
  on public.financial_entries (workspace_id, category_id, occurred_on desc)
  where category_id is not null;
create index if not exists financial_entries_workspace_card_occurred_on_idx
  on public.financial_entries (workspace_id, credit_card_id, occurred_on desc)
  where credit_card_id is not null;

-- Atualiza regra e projeções futuras em uma única transação.
create or replace function public.update_recurring_rule_and_regenerate(
  p_rule_id uuid,
  p_workspace_id uuid,
  p_description text,
  p_amount_cents bigint,
  p_category_id uuid,
  p_credit_card_id uuid,
  p_payment_method public.payment_method,
  p_frequency public.recurrence_frequency,
  p_billing_day smallint,
  p_starts_on date,
  p_generate_until date,
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_rule_type public.recurring_rule_type;
begin
  select rule_type into v_rule_type
  from public.recurring_rules
  where id = p_rule_id and workspace_id = p_workspace_id and public.can_edit_workspace(workspace_id);

  if not found then raise exception 'Recurring rule not found or editor permission is required'; end if;
  if p_amount_cents <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if p_billing_day not between 1 and 31 then raise exception 'Billing day must be between 1 and 31'; end if;
  if p_generate_until < p_starts_on then raise exception 'Generation end must be on or after the start date'; end if;
  if v_rule_type = 'fixed_expense' and p_payment_method = 'credit_card' then raise exception 'Fixed expenses cannot use credit card'; end if;
  if p_category_id is not null and not exists (select 1 from public.categories where id = p_category_id and workspace_id = p_workspace_id) then raise exception 'Category not found in workspace'; end if;
  if p_credit_card_id is not null and not exists (select 1 from public.credit_cards where id = p_credit_card_id and workspace_id = p_workspace_id and is_active) then raise exception 'Credit card not found in workspace'; end if;

  update public.recurring_rules
  set amount_cents = p_amount_cents,
      billing_day = p_billing_day,
      category_id = p_category_id,
      credit_card_id = p_credit_card_id,
      description = trim(p_description),
      frequency = p_frequency,
      generate_until = p_generate_until,
      notes = nullif(trim(p_notes), ''),
      payment_method = p_payment_method,
      starts_on = p_starts_on
  where id = p_rule_id and workspace_id = p_workspace_id;

  delete from public.financial_entries
  where recurring_rule_id = p_rule_id
    and workspace_id = p_workspace_id
    and status = 'pending'
    and occurred_on >= current_date;

  perform public.generate_recurring_entries(p_rule_id);
end;
$$;

create or replace function public.set_recurring_rule_active(
  p_rule_id uuid,
  p_workspace_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.recurring_rules
  set is_active = p_is_active
  where id = p_rule_id
    and workspace_id = p_workspace_id
    and public.can_edit_workspace(workspace_id);

  if not found then raise exception 'Recurring rule not found or editor permission is required'; end if;

  if p_is_active then
    perform public.generate_recurring_entries(p_rule_id);
  else
    delete from public.financial_entries
    where recurring_rule_id = p_rule_id
      and workspace_id = p_workspace_id
      and status = 'pending'
      and occurred_on >= current_date;
  end if;
end;
$$;

create or replace function public.advance_installments(
  p_workspace_id uuid,
  p_purchase_id uuid,
  p_installment_ids uuid[],
  p_discount_cents bigint
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_total_cents bigint;
  v_count integer;
begin
  if not public.can_edit_workspace(p_workspace_id) then raise exception 'Editor permission is required'; end if;
  if coalesce(array_length(p_installment_ids, 1), 0) = 0 then raise exception 'At least one installment is required'; end if;

  select coalesce(sum(amount_cents), 0), count(*) into v_total_cents, v_count
  from public.financial_entries
  where workspace_id = p_workspace_id
    and installment_purchase_id = p_purchase_id
    and status = 'pending'
    and id = any(p_installment_ids);

  if v_count <> array_length(p_installment_ids, 1) then raise exception 'One or more selected installments are unavailable'; end if;
  if p_discount_cents < 0 or p_discount_cents >= v_total_cents then raise exception 'Discount must be smaller than the selected installment total'; end if;

  with selected_entries as (
    select id, amount_cents, row_number() over (order by id) as position, count(*) over () as total_rows
    from public.financial_entries
    where workspace_id = p_workspace_id
      and installment_purchase_id = p_purchase_id
      and status = 'pending'
      and id = any(p_installment_ids)
  ), calculated_discounts as (
    select
      id,
      case
        when position = total_rows then p_discount_cents - coalesce(sum(floor((amount_cents::numeric * p_discount_cents) / v_total_cents)::bigint) over (order by position rows between unbounded preceding and 1 preceding), 0)
        else floor((amount_cents::numeric * p_discount_cents) / v_total_cents)::bigint
      end as discount_cents
    from selected_entries
  )
  update public.financial_entries entry
  set amount_cents = entry.amount_cents - calculated_discounts.discount_cents,
      occurred_on = current_date,
      status = 'paid'
  from calculated_discounts
  where entry.id = calculated_discounts.id;
end;
$$;

-- Sincroniza cabeçalho da compra e parcelas ainda pendentes sem alterar o histórico pago.
create or replace function public.update_installment_purchase(
  p_workspace_id uuid,
  p_purchase_id uuid,
  p_description text,
  p_total_amount_cents bigint,
  p_installment_count smallint,
  p_purchase_date date,
  p_credit_card_id uuid,
  p_category_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_base_amount bigint;
  v_remainder bigint;
  v_number smallint;
  v_month date;
  v_date date;
  v_due_date date;
  v_closing_day smallint;
  v_due_day smallint;
begin
  if not public.can_edit_workspace(p_workspace_id) then raise exception 'Editor permission is required'; end if;
  if char_length(trim(p_description)) not between 1 and 200 then raise exception 'Description must have between 1 and 200 characters'; end if;
  if p_total_amount_cents <= 0 or p_installment_count not between 2 and 360 then raise exception 'Invalid installment values'; end if;
  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and workspace_id = p_workspace_id
  ) then
    raise exception 'Category not found in workspace';
  end if;
  select closing_day, due_day into v_closing_day, v_due_day
  from public.credit_cards
  where id = p_credit_card_id and workspace_id = p_workspace_id and is_active;
  if not found then raise exception 'Credit card not found'; end if;

  if not exists (select 1 from public.installment_purchases where id = p_purchase_id and workspace_id = p_workspace_id) then raise exception 'Installment purchase not found'; end if;

  delete from public.financial_entries where installment_purchase_id = p_purchase_id and workspace_id = p_workspace_id;

  update public.installment_purchases
  set category_id = p_category_id, credit_card_id = p_credit_card_id, description = trim(p_description), total_amount_cents = p_total_amount_cents,
      installment_count = p_installment_count, purchase_date = p_purchase_date, notes = nullif(trim(p_notes), '')
  where id = p_purchase_id and workspace_id = p_workspace_id;

  v_base_amount := p_total_amount_cents / p_installment_count;
  v_remainder := p_total_amount_cents % p_installment_count;
  for v_number in 1..p_installment_count loop
    v_month := (date_trunc('month', p_purchase_date)::date + ((v_number - 1) * interval '1 month'))::date;
    v_date := make_date(extract(year from v_month)::integer, extract(month from v_month)::integer, least(extract(day from p_purchase_date)::integer, extract(day from (v_month + interval '1 month - 1 day'))::integer));
    v_due_date := public.invoice_due_date(v_date, v_closing_day, v_due_day);
    insert into public.financial_entries (workspace_id, created_by_id, user_id, kind, description, amount_cents, occurred_on, category_id, payment_method, credit_card_id, installment_purchase_id, installment_number, installment_count, status, notes)
    values (p_workspace_id, v_actor_id, v_actor_id, 'expense', trim(p_description), v_base_amount + case when v_number <= v_remainder then 1 else 0 end, v_date, p_category_id, 'credit_card', p_credit_card_id, p_purchase_id, v_number, p_installment_count, case when v_due_date < current_date then 'paid'::public.entry_status else 'pending'::public.entry_status end, nullif(trim(p_notes), ''));
  end loop;
end;
$$;

-- As RPCs financeiras nunca devem ser invocadas por sessões anônimas.
revoke all on function public.update_recurring_rule_and_regenerate(uuid, uuid, text, bigint, uuid, uuid, public.payment_method, public.recurrence_frequency, smallint, date, date, text) from public;
revoke all on function public.set_recurring_rule_active(uuid, uuid, boolean) from public;
revoke all on function public.advance_installments(uuid, uuid, uuid[], bigint) from public;
revoke all on function public.update_installment_purchase(uuid, uuid, text, bigint, smallint, date, uuid, uuid, text) from public;

grant execute on function public.update_recurring_rule_and_regenerate(uuid, uuid, text, bigint, uuid, uuid, public.payment_method, public.recurrence_frequency, smallint, date, date, text) to authenticated;
grant execute on function public.set_recurring_rule_active(uuid, uuid, boolean) to authenticated;
grant execute on function public.advance_installments(uuid, uuid, uuid[], bigint) to authenticated;
grant execute on function public.update_installment_purchase(uuid, uuid, text, bigint, smallint, date, uuid, uuid, text) to authenticated;

commit;
