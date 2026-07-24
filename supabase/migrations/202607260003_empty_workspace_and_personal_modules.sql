-- A new Organiza workspace must be empty. The old ledger bootstrap created
-- a fictional account and categories before the person had made a choice.
drop trigger if exists on_auth_user_finance_bootstrap on auth.users;
drop function if exists private.bootstrap_financial_user();

-- Remove only untouched rows that the retired bootstrap could have created.
delete from public.financial_categories category
where category.name in (
  'SalÃ¡rio', 'Receita extra', 'Rendimentos', 'Moradia', 'AlimentaÃ§Ã£o',
  'Transporte', 'SaÃºde', 'EducaÃ§Ã£o', 'Lazer', 'Assinaturas', 'Outros'
)
and not exists (
  select 1 from public.transactions transaction
  where transaction.category_id = category.id
)
and not exists (
  select 1 from public.recurring_entries entry
  where entry.category_id = category.id
)
and not exists (
  select 1 from public.budgets budget
  where budget.category_id = category.id
);

delete from public.financial_accounts account
where account.name = 'Conta principal'
  and account.account_type = 'checking'
  and account.opening_balance_cents = 0
  and not exists (
    select 1 from public.transactions transaction
    where transaction.account_id = account.id
       or transaction.transfer_account_id = account.id
  )
  and not exists (
    select 1 from public.recurring_entries entry
    where entry.account_id = account.id
  )
  and not exists (
    select 1 from public.import_batches batch
    where batch.account_id = account.id
  );

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '' check (char_length(trim(title)) <= 120),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  mood text not null check (mood in ('terrible', 'bad', 'neutral', 'good', 'great')),
  note text check (note is null or char_length(trim(note)) <= 1000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, occurred_on)
);

create table public.personal_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  area text not null default 'personal' check (
    area in ('personal', 'work', 'wellbeing', 'finance', 'home', 'other')
  ),
  target_on date,
  completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index notes_user_updated_idx on public.notes (user_id, pinned desc, updated_at desc);
create index mood_entries_user_day_idx on public.mood_entries (user_id, occurred_on desc);
create index personal_goals_user_open_idx
  on public.personal_goals (user_id, completed, target_on nulls last);

create trigger notes_set_updated_at
before update on public.notes
for each row execute function private.set_updated_at();

create trigger mood_entries_set_updated_at
before update on public.mood_entries
for each row execute function private.set_updated_at();

create trigger personal_goals_set_updated_at
before update on public.personal_goals
for each row execute function private.set_updated_at();

alter table public.notes enable row level security;
alter table public.mood_entries enable row level security;
alter table public.personal_goals enable row level security;

create policy notes_own on public.notes
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy mood_entries_own on public.mood_entries
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy personal_goals_own on public.personal_goals
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.notes, public.mood_entries, public.personal_goals
from public, anon, authenticated;
grant select, insert, update, delete on public.notes, public.mood_entries, public.personal_goals
to authenticated;
