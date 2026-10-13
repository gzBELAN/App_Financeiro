-- App Financeiro — Etapa 2: esquema PostgreSQL para Supabase
-- Execução manual: cole todo este conteúdo no SQL Editor do projeto Supabase.
-- Este script não cria projeto, usuários de autenticação nem qualquer recurso externo.

begin;

create type public.entry_kind as enum ('expense', 'income');
create type public.payment_method as enum ('cash', 'debit_card', 'credit_card', 'pix', 'bank_transfer', 'boleto', 'other');
create type public.entry_status as enum ('pending', 'paid', 'cancelled');
create type public.recurrence_frequency as enum ('monthly', 'quarterly', 'semiannual', 'annual');
create type public.recurring_rule_type as enum ('subscription', 'fixed_expense');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency_code char(3) not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  color char(7) not null default '#64748B' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_user_name_unique unique (user_id, name)
);

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  bank_name text not null check (char_length(trim(bank_name)) between 1 and 80),
  brand text not null check (char_length(trim(brand)) between 1 and 40),
  credit_limit_cents bigint not null check (credit_limit_cents >= 0),
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  color char(7) not null default '#2563EB' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_cards_user_name_unique unique (user_id, name)
);

create table public.installment_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  description text not null check (char_length(trim(description)) between 1 and 200),
  total_amount_cents bigint not null check (total_amount_cents > 0),
  installment_count smallint not null check (installment_count between 2 and 360),
  purchase_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rule_type public.recurring_rule_type not null,
  description text not null check (char_length(trim(description)) between 1 and 200),
  amount_cents bigint not null check (amount_cents > 0),
  category_id uuid references public.categories(id) on delete set null,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  payment_method public.payment_method not null default 'credit_card',
  frequency public.recurrence_frequency not null,
  billing_day smallint not null check (billing_day between 1 and 31),
  starts_on date not null,
  ends_on date,
  generate_until date not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_rules_dates_check check (ends_on is null or ends_on >= starts_on),
  constraint recurring_rules_generation_check check (generate_until >= starts_on),
  constraint recurring_rules_credit_card_check check (
    (payment_method = 'credit_card' and credit_card_id is not null)
    or (payment_method <> 'credit_card' and credit_card_id is null)
  )
);

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.entry_kind not null default 'expense',
  description text not null check (char_length(trim(description)) between 1 and 200),
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  category_id uuid references public.categories(id) on delete set null,
  payment_method public.payment_method not null,
  credit_card_id uuid references public.credit_cards(id) on delete restrict,
  installment_purchase_id uuid references public.installment_purchases(id) on delete cascade,
  installment_number smallint,
  installment_count smallint,
  recurring_rule_id uuid references public.recurring_rules(id) on delete cascade,
  status public.entry_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_entries_credit_card_check check (
    (payment_method = 'credit_card' and credit_card_id is not null)
    or (payment_method <> 'credit_card' and credit_card_id is null)
  ),
  constraint financial_entries_installment_check check (
    (installment_purchase_id is null and installment_number is null and installment_count is null)
    or (
      installment_purchase_id is not null
      and installment_number between 1 and installment_count
      and installment_count >= 2
    )
  ),
  constraint financial_entries_recurring_installment_exclusive check (
    not (installment_purchase_id is not null and recurring_rule_id is not null)
  ),
  constraint financial_entries_installment_unique unique (installment_purchase_id, installment_number),
  constraint financial_entries_recurring_unique unique (recurring_rule_id, occurred_on)
);

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  target_amount_cents bigint not null check (target_amount_cents > 0),
  current_amount_cents bigint not null default 0 check (current_amount_cents >= 0),
  target_date date,
  color char(7) not null default '#16A34A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_goals_user_name_unique unique (user_id, name)
);

-- Índices: filtros recorrentes por usuário, período, cartão, categoria e origem.
create index financial_entries_user_occurred_on_idx on public.financial_entries (user_id, occurred_on desc);
create index financial_entries_user_kind_occurred_on_idx on public.financial_entries (user_id, kind, occurred_on desc);
create index financial_entries_card_occurred_on_idx on public.financial_entries (credit_card_id, occurred_on desc) where credit_card_id is not null;
create index financial_entries_category_occurred_on_idx on public.financial_entries (category_id, occurred_on desc) where category_id is not null;
create index financial_entries_pending_idx on public.financial_entries (user_id, occurred_on) where status = 'pending';
create index installment_purchases_user_date_idx on public.installment_purchases (user_id, purchase_date desc);
create index recurring_rules_user_active_idx on public.recurring_rules (user_id, is_active, generate_until) where is_active = true;
create index credit_cards_user_active_idx on public.credit_cards (user_id, is_active) where is_active = true;
create index financial_goals_user_active_idx on public.financial_goals (user_id, is_archived) where is_archived = false;

-- Mantém updated_at correto em atualizações sem replicar lógica por tabela.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger credit_cards_set_updated_at before update on public.credit_cards for each row execute function public.set_updated_at();
create trigger installment_purchases_set_updated_at before update on public.installment_purchases for each row execute function public.set_updated_at();
create trigger recurring_rules_set_updated_at before update on public.recurring_rules for each row execute function public.set_updated_at();
create trigger financial_entries_set_updated_at before update on public.financial_entries for each row execute function public.set_updated_at();
create trigger financial_goals_set_updated_at before update on public.financial_goals for each row execute function public.set_updated_at();

-- Cria um perfil para cada usuário criado pelo Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Calcula a competência da fatura. Compra até o dia de fechamento pertence ao vencimento do mês seguinte;
-- após o fechamento, pertence ao vencimento do mês posterior.
create or replace function public.invoice_due_date(p_occurred_on date, p_closing_day smallint, p_due_day smallint)
returns date
language sql
immutable
set search_path = public
as $$
  with purchase_month as (
    select date_trunc('month', p_occurred_on)::date as month_start,
           least(p_closing_day, extract(day from (date_trunc('month', p_occurred_on) + interval '1 month - 1 day'))::smallint) as effective_closing_day
  ), due_month as (
    select case
      when extract(day from p_occurred_on)::smallint <= effective_closing_day then month_start + interval '1 month'
      else month_start + interval '2 months'
    end as month_start
    from purchase_month
  )
  select (month_start + (least(p_due_day, extract(day from (month_start + interval '1 month - 1 day'))::smallint) - 1) * interval '1 day')::date
  from due_month;
$$;

-- Cria uma compra parcelada e todas as suas despesas-filhas numa única transação.
-- A divisão distribui os centavos restantes nas primeiras parcelas e evita diferenças no total.
create or replace function public.create_installment_purchase(
  p_description text,
  p_total_amount_cents bigint,
  p_installment_count smallint,
  p_purchase_date date,
  p_credit_card_id uuid,
  p_category_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_purchase_id uuid;
  v_base_amount bigint;
  v_remainder bigint;
  v_installment_number smallint;
  v_month_start date;
  v_occurrence_date date;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_total_amount_cents <= 0 or p_installment_count < 2 then
    raise exception 'Invalid installment values';
  end if;

  if not exists (select 1 from public.credit_cards where id = p_credit_card_id and user_id = v_user_id and is_active) then
    raise exception 'Credit card not found or inactive';
  end if;

  if p_category_id is not null and not exists (select 1 from public.categories where id = p_category_id and user_id = v_user_id) then
    raise exception 'Category not found';
  end if;

  insert into public.installment_purchases (
    user_id, credit_card_id, category_id, description, total_amount_cents, installment_count, purchase_date, notes
  ) values (
    v_user_id, p_credit_card_id, p_category_id, trim(p_description), p_total_amount_cents, p_installment_count, p_purchase_date, nullif(trim(p_notes), '')
  ) returning id into v_purchase_id;

  v_base_amount := p_total_amount_cents / p_installment_count;
  v_remainder := p_total_amount_cents % p_installment_count;

  for v_installment_number in 1..p_installment_count loop
    v_month_start := (date_trunc('month', p_purchase_date)::date + ((v_installment_number - 1) * interval '1 month'))::date;
    v_occurrence_date := make_date(
      extract(year from v_month_start)::integer,
      extract(month from v_month_start)::integer,
      least(
        extract(day from p_purchase_date)::integer,
        extract(day from (v_month_start + interval '1 month - 1 day'))::integer
      )
    );

    insert into public.financial_entries (
      user_id, kind, description, amount_cents, occurred_on, category_id, payment_method, credit_card_id,
      installment_purchase_id, installment_number, installment_count, status, notes
    ) values (
      v_user_id, 'expense', trim(p_description), v_base_amount + case when v_installment_number <= v_remainder then 1 else 0 end,
      v_occurrence_date, p_category_id, 'credit_card', p_credit_card_id, v_purchase_id,
      v_installment_number, p_installment_count, 'pending', nullif(trim(p_notes), '')
    );
  end loop;

  return v_purchase_id;
end;
$$;

-- Materializa lançamentos de uma regra recorrente até generate_until.
-- A constraint única (recurring_rule_id, occurred_on) mantém a operação idempotente.
create or replace function public.generate_recurring_entries(p_rule_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_rule public.recurring_rules%rowtype;
  v_user_id uuid := auth.uid();
  v_months_per_period integer;
  v_period_start date;
  v_occurrence_date date;
  v_created_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select * into v_rule
  from public.recurring_rules
  where id = p_rule_id and user_id = v_user_id and is_active;

  if not found then
    raise exception 'Recurring rule not found or inactive';
  end if;

  v_months_per_period := case v_rule.frequency
    when 'monthly' then 1
    when 'quarterly' then 3
    when 'semiannual' then 6
    when 'annual' then 12
  end;

  v_period_start := date_trunc('month', v_rule.starts_on)::date;
  while v_period_start <= date_trunc('month', v_rule.generate_until)::date loop
    v_occurrence_date := make_date(
      extract(year from v_period_start)::integer,
      extract(month from v_period_start)::integer,
      least(v_rule.billing_day, extract(day from (v_period_start + interval '1 month - 1 day'))::integer)
    );

    if v_occurrence_date >= v_rule.starts_on
       and v_occurrence_date <= v_rule.generate_until
       and (v_rule.ends_on is null or v_occurrence_date <= v_rule.ends_on) then
      insert into public.financial_entries (
        user_id, kind, description, amount_cents, occurred_on, category_id, payment_method,
        credit_card_id, recurring_rule_id, status, notes
      ) values (
        v_rule.user_id, 'expense', v_rule.description, v_rule.amount_cents, v_occurrence_date,
        v_rule.category_id, v_rule.payment_method, v_rule.credit_card_id, v_rule.id, 'pending', v_rule.notes
      ) on conflict (recurring_rule_id, occurred_on) do nothing;

      if found then
        v_created_count := v_created_count + 1;
      end if;
    end if;
    v_period_start := (v_period_start + make_interval(months => v_months_per_period))::date;
  end loop;

  return v_created_count;
end;
$$;

-- Cria uma assinatura e materializa seus lançamentos futuros na mesma transação.
create or replace function public.create_subscription_rule(
  p_description text,
  p_amount_cents bigint,
  p_category_id uuid,
  p_credit_card_id uuid,
  p_frequency public.recurrence_frequency,
  p_billing_day smallint,
  p_starts_on date,
  p_generate_until date,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_rule_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_amount_cents <= 0 or p_generate_until < p_starts_on then
    raise exception 'Invalid recurring values';
  end if;

  if p_credit_card_id is not null and not exists (
    select 1 from public.credit_cards where id = p_credit_card_id and user_id = v_user_id and is_active
  ) then
    raise exception 'Credit card not found or inactive';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and user_id = v_user_id
  ) then
    raise exception 'Category not found';
  end if;

  insert into public.recurring_rules (
    user_id, rule_type, description, amount_cents, category_id, credit_card_id, payment_method,
    frequency, billing_day, starts_on, generate_until, notes
  ) values (
    v_user_id, 'subscription', trim(p_description), p_amount_cents, p_category_id, p_credit_card_id,
    case when p_credit_card_id is null then 'other'::public.payment_method else 'credit_card'::public.payment_method end,
    p_frequency, p_billing_day, p_starts_on, p_generate_until, nullif(trim(p_notes), '')
  ) returning id into v_rule_id;

  perform public.generate_recurring_entries(v_rule_id);
  return v_rule_id;
end;
$$;

-- Cria uma conta fixa e materializa os respectivos lançamentos futuros.
create or replace function public.create_fixed_expense_rule(
  p_description text,
  p_amount_cents bigint,
  p_category_id uuid,
  p_payment_method public.payment_method,
  p_frequency public.recurrence_frequency,
  p_billing_day smallint,
  p_starts_on date,
  p_generate_until date,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_rule_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_amount_cents <= 0 or p_generate_until < p_starts_on then
    raise exception 'Invalid recurring values';
  end if;

  if p_payment_method = 'credit_card' then
    raise exception 'Fixed expenses paid by credit card must use a subscription rule';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and user_id = v_user_id
  ) then
    raise exception 'Category not found';
  end if;

  insert into public.recurring_rules (
    user_id, rule_type, description, amount_cents, category_id, payment_method,
    frequency, billing_day, starts_on, generate_until, notes
  ) values (
    v_user_id, 'fixed_expense', trim(p_description), p_amount_cents, p_category_id, p_payment_method,
    p_frequency, p_billing_day, p_starts_on, p_generate_until, nullif(trim(p_notes), '')
  ) returning id into v_rule_id;

  perform public.generate_recurring_entries(v_rule_id);
  return v_rule_id;
end;
$$;

-- View somente de leitura para alimentar a tela de faturas.
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
  public.invoice_due_date(e.occurred_on, c.closing_day, c.due_day) as due_date
from public.financial_entries e
join public.credit_cards c on c.id = e.credit_card_id
where e.kind = 'expense'
  and e.payment_method = 'credit_card'
  and e.status <> 'cancelled';

-- Segurança: RLS em todas as tabelas privadas.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.credit_cards enable row level security;
alter table public.installment_purchases enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.financial_entries enable row level security;
alter table public.financial_goals enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "categories_manage_own" on public.categories for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "credit_cards_manage_own" on public.credit_cards for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "installment_purchases_manage_own" on public.installment_purchases for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recurring_rules_manage_own" on public.recurring_rules for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "financial_entries_manage_own" on public.financial_entries for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "financial_goals_manage_own" on public.financial_goals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;