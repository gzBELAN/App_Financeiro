-- Ending a fixed expense keeps only confirmed, real payments. Every pending
-- projection is removed, including overdue projections that were never paid.
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

  if not found then
    raise exception 'Recurring rule not found or editor permission is required';
  end if;

  if p_is_active then
    perform public.generate_recurring_entries(p_rule_id);
  else
    delete from public.financial_entries
    where recurring_rule_id = p_rule_id
      and workspace_id = p_workspace_id
      and status = 'pending';
  end if;
end;
$$;

revoke all on function public.set_recurring_rule_active(uuid, uuid, boolean) from public;
grant execute on function public.set_recurring_rule_active(uuid, uuid, boolean) to authenticated;