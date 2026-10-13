-- App Financeiro — migração incremental para controles financeiros compartilhados.
-- Execute este arquivo manualmente APÓS descricao_consulta.sql, uma única vez, no SQL Editor do Supabase.

begin;

create type public.workspace_member_role as enum ('owner', 'editor', 'viewer');

create table public.financial_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  owner_profile_id uuid not null references public.profiles(id) on delete restrict,
  currency_code char(3) not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.financial_workspaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_member_role not null default 'editor',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, profile_id)
);

-- Cada perfil existente recebe um controle pessoal e todos os seus dados são migrados para ele.
insert into public.financial_workspaces (name, owner_profile_id, currency_code)
select coalesce(nullif(trim(display_name), ''), 'Meu controle financeiro'), id, currency_code
from public.profiles;

insert into public.workspace_members (workspace_id, profile_id, role)
select id, owner_profile_id, 'owner'
from public.financial_workspaces;

alter table public.categories add column workspace_id uuid references public.financial_workspaces(id) on delete cascade;
alter table public.credit_cards add column workspace_id uuid references public.financial_workspaces(id) on delete cascade;
alter table public.installment_purchases add column workspace_id uuid references public.financial_workspaces(id) on delete cascade;
alter table public.recurring_rules add column workspace_id uuid references public.financial_workspaces(id) on delete cascade;
alter table public.financial_entries add column workspace_id uuid references public.financial_workspaces(id) on delete cascade;
alter table public.financial_goals add column workspace_id uuid references public.financial_workspaces(id) on delete cascade;

alter table public.categories add column created_by_id uuid references public.profiles(id) on delete set null;
alter table public.credit_cards add column created_by_id uuid references public.profiles(id) on delete set null;
alter table public.installment_purchases add column created_by_id uuid references public.profiles(id) on delete set null;
alter table public.recurring_rules add column created_by_id uuid references public.profiles(id) on delete set null;
alter table public.financial_entries add column created_by_id uuid references public.profiles(id) on delete set null;
alter table public.financial_goals add column created_by_id uuid references public.profiles(id) on delete set null;

update public.categories t set workspace_id = w.id, created_by_id = t.user_id from public.financial_workspaces w where w.owner_profile_id = t.user_id;
update public.credit_cards t set workspace_id = w.id, created_by_id = t.user_id from public.financial_workspaces w where w.owner_profile_id = t.user_id;
update public.installment_purchases t set workspace_id = w.id, created_by_id = t.user_id from public.financial_workspaces w where w.owner_profile_id = t.user_id;
update public.recurring_rules t set workspace_id = w.id, created_by_id = t.user_id from public.financial_workspaces w where w.owner_profile_id = t.user_id;
update public.financial_entries t set workspace_id = w.id, created_by_id = t.user_id from public.financial_workspaces w where w.owner_profile_id = t.user_id;
update public.financial_goals t set workspace_id = w.id, created_by_id = t.user_id from public.financial_workspaces w where w.owner_profile_id = t.user_id;

alter table public.categories alter column workspace_id set not null;
alter table public.credit_cards alter column workspace_id set not null;
alter table public.installment_purchases alter column workspace_id set not null;
alter table public.recurring_rules alter column workspace_id set not null;
alter table public.financial_entries alter column workspace_id set not null;
alter table public.financial_goals alter column workspace_id set not null;

alter table public.categories drop constraint categories_user_name_unique;
alter table public.credit_cards drop constraint credit_cards_user_name_unique;
alter table public.financial_goals drop constraint financial_goals_user_name_unique;
alter table public.categories add constraint categories_workspace_name_unique unique (workspace_id, name);
alter table public.credit_cards add constraint credit_cards_workspace_name_unique unique (workspace_id, name);
alter table public.financial_goals add constraint financial_goals_workspace_name_unique unique (workspace_id, name);

create index financial_entries_workspace_occurred_on_idx on public.financial_entries (workspace_id, occurred_on desc);
create index financial_entries_workspace_kind_occurred_on_idx on public.financial_entries (workspace_id, kind, occurred_on desc);
create index financial_entries_workspace_pending_idx on public.financial_entries (workspace_id, occurred_on) where status = 'pending';
create index installment_purchases_workspace_date_idx on public.installment_purchases (workspace_id, purchase_date desc);
create index recurring_rules_workspace_active_idx on public.recurring_rules (workspace_id, is_active, generate_until) where is_active;
create index credit_cards_workspace_active_idx on public.credit_cards (workspace_id, is_active) where is_active;
create index financial_goals_workspace_active_idx on public.financial_goals (workspace_id, is_archived) where not is_archived;

create trigger financial_workspaces_set_updated_at before update on public.financial_workspaces for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and profile_id = auth.uid());
$$;

create or replace function public.can_edit_workspace(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and profile_id = auth.uid() and role in ('owner', 'editor'));
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and profile_id = auth.uid() and role = 'owner');
$$;

alter table public.financial_workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "categories_manage_own" on public.categories;
drop policy if exists "credit_cards_manage_own" on public.credit_cards;
drop policy if exists "installment_purchases_manage_own" on public.installment_purchases;
drop policy if exists "recurring_rules_manage_own" on public.recurring_rules;
drop policy if exists "financial_entries_manage_own" on public.financial_entries;
drop policy if exists "financial_goals_manage_own" on public.financial_goals;

create policy "workspaces_select_member" on public.financial_workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "workspaces_create_authenticated" on public.financial_workspaces for insert to authenticated with check (owner_profile_id = auth.uid());
create policy "workspaces_update_owner" on public.financial_workspaces for update to authenticated using (public.is_workspace_owner(id)) with check (public.is_workspace_owner(id));
create policy "workspaces_delete_owner" on public.financial_workspaces for delete to authenticated using (public.is_workspace_owner(id));
create policy "members_select_member" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members_owner_manage" on public.workspace_members for all to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));

create policy "categories_member_read" on public.categories for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "categories_editor_write" on public.categories for all to authenticated using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));
create policy "cards_member_read" on public.credit_cards for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "cards_editor_write" on public.credit_cards for all to authenticated using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));
create policy "purchases_member_read" on public.installment_purchases for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "purchases_editor_write" on public.installment_purchases for all to authenticated using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));
create policy "rules_member_read" on public.recurring_rules for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "rules_editor_write" on public.recurring_rules for all to authenticated using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));
create policy "entries_member_read" on public.financial_entries for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "entries_editor_write" on public.financial_entries for all to authenticated using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));
create policy "goals_member_read" on public.financial_goals for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "goals_editor_write" on public.financial_goals for all to authenticated using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id));

-- Substitui o gatilho para que cada usuário novo receba um controle pessoal e a associação de proprietário.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_workspace_id uuid;
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  insert into public.financial_workspaces (name, owner_profile_id) values (coalesce(new.raw_user_meta_data ->> 'display_name', new.email, 'Meu controle financeiro'), new.id) returning id into v_workspace_id;
  insert into public.workspace_members (workspace_id, profile_id, role) values (v_workspace_id, new.id, 'owner');
  return new;
end;
$$;

create or replace function public.add_workspace_member_by_email(p_workspace_id uuid, p_email text, p_role public.workspace_member_role default 'editor')
returns void language plpgsql security definer set search_path = public as $$
declare v_profile_id uuid;
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Only an owner can add members'; end if;
  select id into v_profile_id from auth.users where lower(email) = lower(trim(p_email));
  if v_profile_id is null then raise exception 'User must create an account before being added'; end if;
  insert into public.workspace_members (workspace_id, profile_id, role) values (p_workspace_id, v_profile_id, p_role)
  on conflict (workspace_id, profile_id) do update set role = excluded.role;
end;
$$;

-- Recria lançamentos recorrentes preservando o controle compartilhado e o autor da regra.
create or replace function public.generate_recurring_entries(p_rule_id uuid)
returns integer language plpgsql security invoker set search_path = public as $$
declare v_rule public.recurring_rules%rowtype; v_months integer; v_period date; v_date date; v_created integer := 0;
begin
  select * into v_rule from public.recurring_rules where id = p_rule_id and public.can_edit_workspace(workspace_id) and is_active;
  if not found then raise exception 'Recurring rule not found or editor permission is required'; end if;
  v_months := case v_rule.frequency when 'monthly' then 1 when 'quarterly' then 3 when 'semiannual' then 6 when 'annual' then 12 end;
  v_period := date_trunc('month', v_rule.starts_on)::date;
  while v_period <= date_trunc('month', v_rule.generate_until)::date loop
    v_date := make_date(extract(year from v_period)::integer, extract(month from v_period)::integer, least(v_rule.billing_day, extract(day from (v_period + interval '1 month - 1 day'))::integer));
    if v_date >= v_rule.starts_on and v_date <= v_rule.generate_until and (v_rule.ends_on is null or v_date <= v_rule.ends_on) then
      insert into public.financial_entries (workspace_id, created_by_id, user_id, kind, description, amount_cents, occurred_on, category_id, payment_method, credit_card_id, recurring_rule_id, status, notes)
      values (v_rule.workspace_id, v_rule.created_by_id, v_rule.user_id, 'expense', v_rule.description, v_rule.amount_cents, v_date, v_rule.category_id, v_rule.payment_method, v_rule.credit_card_id, v_rule.id, 'pending', v_rule.notes)
      on conflict (recurring_rule_id, occurred_on) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;
    v_period := (v_period + make_interval(months => v_months))::date;
  end loop;
  return v_created;
end; $$;

-- Funções financeiras passam a validar permissão de edição no controle selecionado.
create or replace function public.create_installment_purchase(p_description text, p_total_amount_cents bigint, p_installment_count smallint, p_purchase_date date, p_credit_card_id uuid, p_category_id uuid default null, p_notes text default null, p_workspace_id uuid default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_actor_id uuid := auth.uid(); v_purchase_id uuid; v_base_amount bigint; v_remainder bigint; v_number smallint; v_month date; v_date date;
begin
  if not public.can_edit_workspace(p_workspace_id) then raise exception 'Editor permission is required'; end if;
  if not exists (select 1 from public.credit_cards where id = p_credit_card_id and workspace_id = p_workspace_id and is_active) then raise exception 'Credit card not found'; end if;
  if p_category_id is not null and not exists (select 1 from public.categories where id = p_category_id and workspace_id = p_workspace_id) then raise exception 'Category not found'; end if;
  insert into public.installment_purchases (workspace_id, created_by_id, user_id, credit_card_id, category_id, description, total_amount_cents, installment_count, purchase_date, notes)
  values (p_workspace_id, v_actor_id, v_actor_id, p_credit_card_id, p_category_id, trim(p_description), p_total_amount_cents, p_installment_count, p_purchase_date, nullif(trim(p_notes), '')) returning id into v_purchase_id;
  v_base_amount := p_total_amount_cents / p_installment_count; v_remainder := p_total_amount_cents % p_installment_count;
  for v_number in 1..p_installment_count loop
    v_month := (date_trunc('month', p_purchase_date)::date + ((v_number - 1) * interval '1 month'))::date;
    v_date := make_date(extract(year from v_month)::integer, extract(month from v_month)::integer, least(extract(day from p_purchase_date)::integer, extract(day from (v_month + interval '1 month - 1 day'))::integer));
    insert into public.financial_entries (workspace_id, created_by_id, user_id, kind, description, amount_cents, occurred_on, category_id, payment_method, credit_card_id, installment_purchase_id, installment_number, installment_count, status, notes)
    values (p_workspace_id, v_actor_id, v_actor_id, 'expense', trim(p_description), v_base_amount + case when v_number <= v_remainder then 1 else 0 end, v_date, p_category_id, 'credit_card', p_credit_card_id, v_purchase_id, v_number, p_installment_count, 'pending', nullif(trim(p_notes), ''));
  end loop; return v_purchase_id;
end; $$;

create or replace function public.create_subscription_rule(p_description text, p_amount_cents bigint, p_category_id uuid, p_credit_card_id uuid, p_frequency public.recurrence_frequency, p_billing_day smallint, p_starts_on date, p_generate_until date, p_notes text default null, p_workspace_id uuid default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_actor_id uuid := auth.uid(); v_rule_id uuid;
begin
  if not public.can_edit_workspace(p_workspace_id) then raise exception 'Editor permission is required'; end if;
  if p_credit_card_id is not null and not exists (select 1 from public.credit_cards where id = p_credit_card_id and workspace_id = p_workspace_id and is_active) then raise exception 'Credit card not found'; end if;
  if p_category_id is not null and not exists (select 1 from public.categories where id = p_category_id and workspace_id = p_workspace_id) then raise exception 'Category not found'; end if;
  insert into public.recurring_rules (workspace_id, created_by_id, user_id, rule_type, description, amount_cents, category_id, credit_card_id, payment_method, frequency, billing_day, starts_on, generate_until, notes)
  values (p_workspace_id, v_actor_id, v_actor_id, 'subscription', trim(p_description), p_amount_cents, p_category_id, p_credit_card_id, case when p_credit_card_id is null then 'other'::public.payment_method else 'credit_card'::public.payment_method end, p_frequency, p_billing_day, p_starts_on, p_generate_until, nullif(trim(p_notes), '')) returning id into v_rule_id;
  perform public.generate_recurring_entries(v_rule_id); return v_rule_id;
end; $$;

create or replace function public.create_fixed_expense_rule(p_description text, p_amount_cents bigint, p_category_id uuid, p_payment_method public.payment_method, p_frequency public.recurrence_frequency, p_billing_day smallint, p_starts_on date, p_generate_until date, p_notes text default null, p_workspace_id uuid default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_actor_id uuid := auth.uid(); v_rule_id uuid;
begin
  if not public.can_edit_workspace(p_workspace_id) then raise exception 'Editor permission is required'; end if;
  if p_category_id is not null and not exists (select 1 from public.categories where id = p_category_id and workspace_id = p_workspace_id) then raise exception 'Category not found'; end if;
  if p_payment_method = 'credit_card' then raise exception 'Fixed expenses cannot use credit card'; end if;
  insert into public.recurring_rules (workspace_id, created_by_id, user_id, rule_type, description, amount_cents, category_id, payment_method, frequency, billing_day, starts_on, generate_until, notes)
  values (p_workspace_id, v_actor_id, v_actor_id, 'fixed_expense', trim(p_description), p_amount_cents, p_category_id, p_payment_method, p_frequency, p_billing_day, p_starts_on, p_generate_until, nullif(trim(p_notes), '')) returning id into v_rule_id;
  perform public.generate_recurring_entries(v_rule_id); return v_rule_id;
end; $$;

commit;