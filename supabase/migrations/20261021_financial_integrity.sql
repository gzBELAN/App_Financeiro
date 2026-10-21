-- App Financeiro — garantias de integridade entre controles financeiros.
-- Execute após bank_accounts_and_salary.sql em um projeto Supabase novo.
-- Este arquivo não acessa serviços externos; sua execução é manual no SQL Editor.

begin;

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

commit;
