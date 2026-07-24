create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expense_type text not null check (expense_type in ('fixed', 'variable')),
  description text not null check (char_length(trim(description)) between 1 and 120),
  category text not null check (char_length(trim(category)) between 1 and 60),
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null,
  due_day smallint check (due_day between 1 and 31),
  source text not null default 'manual' check (source in ('manual', 'bank_import')),
  import_fingerprint text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (expense_type = 'fixed' and due_day is not null)
    or (expense_type = 'variable' and due_day is null)
  )
);

create index expenses_user_date_idx
on public.expenses (user_id, expense_date desc);

create unique index expenses_user_import_fingerprint_idx
on public.expenses (user_id, import_fingerprint)
where import_fingerprint is not null;

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function private.set_updated_at();

alter table public.expenses enable row level security;

create policy expenses_select_own on public.expenses
for select to authenticated
using ((select auth.uid()) = user_id);

create policy expenses_insert_own on public.expenses
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy expenses_update_own on public.expenses
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy expenses_delete_own on public.expenses
for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.expenses from public, anon, authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
