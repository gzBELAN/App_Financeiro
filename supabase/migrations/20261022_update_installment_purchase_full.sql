-- App Financeiro — correção completa de compras parceladas.
-- Execute manualmente após 20261022_installment_historical_status.sql.

begin;

-- Remove a assinatura anterior, limitada a descrição, categoria e observações.
drop function if exists public.update_installment_purchase(uuid, uuid, text, uuid, text);

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
  if not public.can_edit_workspace(p_workspace_id) then
    raise exception 'Editor permission is required';
  end if;

  if p_total_amount_cents <= 0 or p_installment_count not between 2 and 360 then
    raise exception 'Invalid installment values';
  end if;

  if not exists (
    select 1 from public.installment_purchases
    where id = p_purchase_id and workspace_id = p_workspace_id
  ) then
    raise exception 'Installment purchase not found';
  end if;

  select closing_day, due_day
  into v_closing_day, v_due_day
  from public.credit_cards
  where id = p_credit_card_id and workspace_id = p_workspace_id and is_active;

  if not found then
    raise exception 'Credit card not found';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and workspace_id = p_workspace_id
  ) then
    raise exception 'Category not found';
  end if;

  -- A correção recria todas as parcelas, inclusive as já marcadas como pagas.
  delete from public.financial_entries
  where installment_purchase_id = p_purchase_id and workspace_id = p_workspace_id;

  update public.installment_purchases
  set description = trim(p_description),
      total_amount_cents = p_total_amount_cents,
      installment_count = p_installment_count,
      purchase_date = p_purchase_date,
      credit_card_id = p_credit_card_id,
      category_id = p_category_id,
      notes = nullif(trim(p_notes), '')
  where id = p_purchase_id and workspace_id = p_workspace_id;

  v_base_amount := p_total_amount_cents / p_installment_count;
  v_remainder := p_total_amount_cents % p_installment_count;

  for v_number in 1..p_installment_count loop
    v_month := (date_trunc('month', p_purchase_date)::date + ((v_number - 1) * interval '1 month'))::date;
    v_date := make_date(
      extract(year from v_month)::integer,
      extract(month from v_month)::integer,
      least(extract(day from p_purchase_date)::integer, extract(day from (v_month + interval '1 month - 1 day'))::integer)
    );
    v_due_date := public.invoice_due_date(v_date, v_closing_day, v_due_day);

    insert into public.financial_entries (
      workspace_id, created_by_id, user_id, kind, description, amount_cents,
      occurred_on, category_id, payment_method, credit_card_id,
      installment_purchase_id, installment_number, installment_count, status, notes
    ) values (
      p_workspace_id, v_actor_id, v_actor_id, 'expense', trim(p_description),
      v_base_amount + case when v_number <= v_remainder then 1 else 0 end,
      v_date, p_category_id, 'credit_card', p_credit_card_id,
      p_purchase_id, v_number, p_installment_count,
      case when v_due_date < current_date then 'paid'::public.entry_status else 'pending'::public.entry_status end,
      nullif(trim(p_notes), '')
    );
  end loop;
end;
$$;

revoke all on function public.update_installment_purchase(uuid, uuid, text, bigint, smallint, date, uuid, uuid, text) from public;
grant execute on function public.update_installment_purchase(uuid, uuid, text, bigint, smallint, date, uuid, uuid, text) to authenticated;

commit;