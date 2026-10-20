-- App Financeiro — bancos, contas, cartões vinculados e planejamento de salário.
-- Execute uma única vez após workspace_settings_management.sql.

begin;

create type public.bank_account_type as enum ('checking', 'savings', 'cash', 'investment', 'other');
create type public.card_type as enum ('credit', 'debit', 'credit_debit');

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.financial_workspaces(id) on delete cascade,
  created_by_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  bank_name text not null check (char_length(trim(bank_name)) between 1 and 80),
  account_type public.bank_account_type not null default 'checking',
  current_balance_cents bigint not null default 0,
  color char(7) not null default '#2563EB' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bank_accounts_workspace_name_unique unique (workspace_id, name)
);

alter table public.credit_cards add column bank_account_id uuid references public.bank_accounts(id) on delete restrict;
alter table public.credit_cards add column card_type public.card_type not null default 'credit';
alter table public.financial_entries add column bank_account_id uuid references public.bank_accounts(id) on delete restrict;
alter table public.financial_workspaces add column monthly_salary_cents bigint not null default 0 check (monthly_salary_cents >= 0);

create index bank_accounts_workspace_active_idx on public.bank_accounts (workspace_id, is_active) where is_active;
create index credit_cards_bank_account_idx on public.credit_cards (bank_account_id) where bank_account_id is not null;
create index financial_entries_bank_account_idx on public.financial_entries (bank_account_id, occurred_on desc) where bank_account_id is not null;

create trigger bank_accounts_set_updated_at before update on public.bank_accounts for each row execute function public.set_updated_at();

alter table public.bank_accounts enable row level security;

create policy "accounts_member_read" on public.bank_accounts for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "accounts_editor_write" on public.bank_accounts for all to authenticated using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));
create policy "workspaces_member_salary_read" on public.financial_workspaces for select to authenticated using (public.is_workspace_member(id));

-- Migra cartões existentes para uma conta de mesmo banco. Registros diferentes no mesmo banco
-- compartilham uma única conta criada automaticamente.
insert into public.bank_accounts (workspace_id, created_by_id, name, bank_name, account_type, color)
select distinct on (c.workspace_id, lower(trim(c.bank_name)))
  c.workspace_id,
  c.created_by_id,
  c.bank_name,
  c.bank_name,
  'checking'::public.bank_account_type,
  c.color
from public.credit_cards c
where c.bank_account_id is null
order by c.workspace_id, lower(trim(c.bank_name)), c.created_at;

update public.credit_cards c
set bank_account_id = a.id
from public.bank_accounts a
where c.bank_account_id is null
  and a.workspace_id = c.workspace_id
  and lower(trim(a.bank_name)) = lower(trim(c.bank_name));

-- A partir desta migração, todo cartão precisa pertencer a uma conta bancária.
alter table public.credit_cards alter column bank_account_id set not null;

commit;