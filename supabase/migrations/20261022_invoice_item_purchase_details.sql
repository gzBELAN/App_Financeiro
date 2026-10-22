-- Adds the original purchase date for installment invoice entries.
-- The dashboard uses it to show the first-installment purchase date and order
-- commitments chronologically by the purchase, rather than by each installment.
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