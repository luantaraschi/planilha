create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  account_type text not null check (
    account_type in ('checking', 'cash', 'savings', 'credit')
  ),
  opening_balance_cents bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  category_type text not null check (category_type in ('income', 'expense')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, category_type, name)
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  file_type text not null check (file_type in ('csv', 'ofx')),
  confirmation_key text not null check (
    char_length(confirmation_key) between 1 and 128
  ),
  status text not null default 'reviewed' check (
    status in ('reviewed', 'completed', 'failed')
  ),
  row_count integer not null default 0 check (row_count >= 0),
  imported_count integer not null default 0 check (imported_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, account_id, confirmation_key),
  foreign key (account_id, user_id)
    references public.financial_accounts(id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  transaction_type text not null check (
    transaction_type in ('income', 'expense', 'transfer', 'adjustment')
  ),
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  due_on date,
  status text not null check (status in ('planned', 'cleared', 'ignored')),
  description text not null check (
    char_length(trim(description)) between 1 and 120
  ),
  category_id uuid,
  transfer_account_id uuid,
  import_batch_id uuid,
  import_fingerprint text,
  source text not null default 'manual' check (
    source in ('manual', 'bank_import', 'legacy')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (account_id, user_id)
    references public.financial_accounts(id, user_id),
  foreign key (category_id, user_id)
    references public.financial_categories(id, user_id),
  foreign key (transfer_account_id, user_id)
    references public.financial_accounts(id, user_id),
  foreign key (import_batch_id, user_id)
    references public.import_batches(id, user_id),
  constraint transactions_source_import_context check (
    (
      source = 'bank_import'
      and import_batch_id is not null
      and import_fingerprint is not null
    )
    or (
      source = 'manual'
      and import_batch_id is null
      and import_fingerprint is null
    )
    or (
      source = 'legacy'
      and import_batch_id is null
      and import_fingerprint is not null
    )
  ),
  check (
    (
      transaction_type = 'transfer'
      and transfer_account_id is not null
      and transfer_account_id <> account_id
      and category_id is null
    )
    or (
      transaction_type <> 'transfer'
      and transfer_account_id is null
    )
  )
);

create table public.recurring_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  transaction_type text not null check (
    transaction_type in ('income', 'expense')
  ),
  amount_cents bigint not null check (amount_cents > 0),
  description text not null check (
    char_length(trim(description)) between 1 and 120
  ),
  category_id uuid,
  frequency text not null check (
    frequency in ('weekly', 'monthly', 'yearly')
  ),
  next_due_on date not null,
  due_day smallint check (due_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (account_id, user_id)
    references public.financial_accounts(id, user_id),
  foreign key (category_id, user_id)
    references public.financial_categories(id, user_id)
);

create table public.import_batch_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null,
  transaction_id uuid,
  row_number integer not null check (row_number > 0),
  occurred_on date,
  description text not null check (char_length(trim(description)) between 1 and 120),
  signed_amount_cents bigint not null check (signed_amount_cents <> 0),
  transaction_type text not null check (
    transaction_type in ('income', 'expense')
  ),
  import_fingerprint text not null,
  review_status text not null check (
    review_status in ('imported', 'duplicate', 'skipped')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  unique (batch_id, row_number),
  foreign key (batch_id, user_id)
    references public.import_batches(id, user_id) on delete cascade,
  foreign key (transaction_id, user_id)
    references public.transactions(id, user_id)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  month date not null check (month = date_trunc('month', month)::date),
  amount_cents bigint not null check (amount_cents > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique nulls not distinct (user_id, category_id, month),
  foreign key (category_id, user_id)
    references public.financial_categories(id, user_id)
);

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  target_cents bigint not null check (target_cents > 0),
  saved_cents bigint not null default 0 check (saved_cents >= 0),
  target_on date,
  status text not null default 'active' check (
    status in ('active', 'completed', 'paused')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index transactions_user_occurred_idx
on public.transactions (user_id, occurred_on desc);

create unique index transactions_user_import_fingerprint_idx
on public.transactions (user_id, account_id, import_fingerprint)
where import_fingerprint is not null;

create index recurring_entries_user_due_idx
on public.recurring_entries (user_id, next_due_on)
where active;

create index budgets_user_month_idx
on public.budgets (user_id, month);

create index financial_goals_user_status_idx
on public.financial_goals (user_id, status);

create trigger financial_accounts_set_updated_at
before update on public.financial_accounts
for each row execute function private.set_updated_at();

create trigger financial_categories_set_updated_at
before update on public.financial_categories
for each row execute function private.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function private.set_updated_at();

create trigger recurring_entries_set_updated_at
before update on public.recurring_entries
for each row execute function private.set_updated_at();

create trigger import_batches_set_updated_at
before update on public.import_batches
for each row execute function private.set_updated_at();

create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function private.set_updated_at();

create trigger financial_goals_set_updated_at
before update on public.financial_goals
for each row execute function private.set_updated_at();

create or replace function private.bootstrap_financial_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.financial_accounts (user_id, name, account_type)
  values (new.id, 'Conta principal', 'checking');

  insert into public.financial_categories (user_id, name, category_type)
  values
    (new.id, 'Salário', 'income'),
    (new.id, 'Receita extra', 'income'),
    (new.id, 'Rendimentos', 'income'),
    (new.id, 'Moradia', 'expense'),
    (new.id, 'Alimentação', 'expense'),
    (new.id, 'Transporte', 'expense'),
    (new.id, 'Saúde', 'expense'),
    (new.id, 'Educação', 'expense'),
    (new.id, 'Lazer', 'expense'),
    (new.id, 'Assinaturas', 'expense'),
    (new.id, 'Outros', 'expense');

  return new;
end;
$$;

insert into public.financial_accounts (user_id, name, account_type)
select id, 'Conta principal', 'checking'
from auth.users
on conflict (user_id, name) do nothing;

insert into public.financial_categories (user_id, name, category_type)
select users.id, defaults.name, defaults.category_type
from auth.users users
cross join (
  values
    ('Salário', 'income'),
    ('Receita extra', 'income'),
    ('Rendimentos', 'income'),
    ('Moradia', 'expense'),
    ('Alimentação', 'expense'),
    ('Transporte', 'expense'),
    ('Saúde', 'expense'),
    ('Educação', 'expense'),
    ('Lazer', 'expense'),
    ('Assinaturas', 'expense'),
    ('Outros', 'expense')
) as defaults(name, category_type)
on conflict (user_id, category_type, name) do nothing;

create or replace function private.monthly_due_on(
  month_input date,
  due_day_input integer
)
returns date
language sql
immutable
strict
set search_path = ''
as $$
  select date_trunc('month', month_input)::date
    + (
      least(
        due_day_input,
        extract(
          day from date_trunc('month', month_input)
            + interval '1 month - 1 day'
        )::integer
      ) - 1
    );
$$;

insert into public.transactions (
  user_id,
  account_id,
  transaction_type,
  amount_cents,
  occurred_on,
  status,
  description,
  category_id,
  import_fingerprint,
  source
)
select
  expense.user_id,
  account.id,
  'expense',
  round(expense.amount * 100)::bigint,
  expense.expense_date,
  'cleared',
  expense.description,
  category.id,
  'legacy-expense:' || expense.id::text,
  'legacy'
from public.expenses expense
join public.financial_accounts account
  on account.user_id = expense.user_id
 and account.name = 'Conta principal'
left join public.financial_categories category
  on category.user_id = expense.user_id
 and category.category_type = 'expense'
 and category.name = expense.category
on conflict (user_id, account_id, import_fingerprint)
  where import_fingerprint is not null
do nothing;

insert into public.recurring_entries (
  user_id,
  account_id,
  transaction_type,
  amount_cents,
  description,
  category_id,
  frequency,
  next_due_on,
  due_day,
  active
)
select
  expense.user_id,
  account.id,
  'expense',
  round(expense.amount * 100)::bigint,
  expense.description,
  category.id,
  'monthly',
  case
    when private.monthly_due_on(
      timezone(preferences.timezone, now())::date,
      expense.due_day
    ) >= timezone(preferences.timezone, now())::date
      then private.monthly_due_on(
        timezone(preferences.timezone, now())::date,
        expense.due_day
      )
    else private.monthly_due_on(
      (
        timezone(preferences.timezone, now())::date
        + interval '1 month'
      )::date,
      expense.due_day
    )
  end,
  expense.due_day,
  expense.active
from public.expenses expense
join public.financial_accounts account
  on account.user_id = expense.user_id
 and account.name = 'Conta principal'
join public.preferences preferences
  on preferences.user_id = expense.user_id
left join public.financial_categories category
  on category.user_id = expense.user_id
 and category.category_type = 'expense'
 and category.name = expense.category
where expense.expense_type = 'fixed';

do $$
declare
  legacy_total bigint;
  ledger_total bigint;
begin
  select coalesce(sum(round(amount * 100)::bigint), 0)
  into legacy_total
  from public.expenses;

  select coalesce(sum(amount_cents), 0)
  into ledger_total
  from public.transactions
  where import_fingerprint like 'legacy-expense:%';

  if legacy_total <> ledger_total then
    raise exception 'legacy finance reconciliation failed';
  end if;
end;
$$;

create trigger on_auth_user_finance_bootstrap
after insert on auth.users
for each row execute function private.bootstrap_financial_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'financial_accounts',
    'financial_categories',
    'recurring_entries',
    'budgets',
    'financial_goals'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_select_own',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name || '_insert_own',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name || '_update_own',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_delete_own',
      table_name
    );
    execute format(
      'revoke all on public.%I from public, anon, authenticated',
      table_name
    );
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated',
      table_name
    );
  end loop;
end;
$$;

alter table public.transactions enable row level security;

create policy transactions_select_own
on public.transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy transactions_insert_manual
on public.transactions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and source = 'manual'
  and import_batch_id is null
  and import_fingerprint is null
);

create policy transactions_update_manual
on public.transactions
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and source = 'manual'
  and import_batch_id is null
  and import_fingerprint is null
)
with check (
  (select auth.uid()) = user_id
  and source = 'manual'
  and import_batch_id is null
  and import_fingerprint is null
);

create policy transactions_delete_manual
on public.transactions
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and source = 'manual'
  and import_batch_id is null
  and import_fingerprint is null
);

revoke all on public.transactions from public, anon, authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

alter table public.import_batches enable row level security;
alter table public.import_batch_rows enable row level security;

create policy import_batches_select_own
on public.import_batches
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy import_batch_rows_select_own
on public.import_batch_rows
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.import_batches, public.import_batch_rows from public, anon, authenticated;
grant select on public.import_batches, public.import_batch_rows to authenticated;

create or replace function public.confirm_statement_import(
  account_id_input uuid,
  file_name_input text,
  file_type_input text,
  confirmation_key_input text,
  rows_input jsonb
)
returns table(imported_count integer, duplicate_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  batch_id_value uuid;
  transaction_id_value uuid;
  income_category_id uuid;
  expense_category_id uuid;
  row_value jsonb;
  row_number_value integer;
  occurred_on_value date;
  description_value text;
  amount_cents_value bigint;
  transaction_type_value text;
  fingerprint_value text;
  imported_count_value integer := 0;
  duplicate_count_value integer := 0;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;
  if not exists (
    select 1
    from public.financial_accounts account
    where account.id = account_id_input
      and account.user_id = current_user_id
      and account.active
  ) then
    raise exception 'invalid account';
  end if;
  if char_length(trim(file_name_input)) not between 1 and 255
    or file_type_input not in ('csv', 'ofx')
    or char_length(confirmation_key_input) not between 1 and 128
    or jsonb_typeof(rows_input) <> 'array'
    or jsonb_array_length(rows_input) not between 1 and 1000
  then
    raise exception 'invalid import confirmation';
  end if;

  insert into public.import_batches (
    user_id,
    account_id,
    file_name,
    file_type,
    confirmation_key,
    status,
    row_count
  )
  values (
    current_user_id,
    account_id_input,
    trim(file_name_input),
    file_type_input,
    confirmation_key_input,
    'reviewed',
    jsonb_array_length(rows_input)
  )
  on conflict (user_id, account_id, confirmation_key) do nothing
  returning id into batch_id_value;

  if batch_id_value is null then
    select
      batch.imported_count,
      batch.duplicate_count
    into
      imported_count_value,
      duplicate_count_value
    from public.import_batches batch
    where batch.user_id = current_user_id
      and batch.account_id = account_id_input
      and batch.confirmation_key = confirmation_key_input
      and batch.status = 'completed';

    if not found then
      raise exception 'import confirmation is already in progress';
    end if;
    return query
      select imported_count_value, duplicate_count_value;
    return;
  end if;

  select category.id
  into income_category_id
  from public.financial_categories category
  where category.user_id = current_user_id
    and category.category_type = 'income'
    and category.name = 'Receita extra'
    and category.active;

  select category.id
  into expense_category_id
  from public.financial_categories category
  where category.user_id = current_user_id
    and category.category_type = 'expense'
    and category.name = 'Outros'
    and category.active;

  if income_category_id is null or expense_category_id is null then
    raise exception 'default import categories are unavailable';
  end if;

  for row_value in
    select item
    from jsonb_array_elements(rows_input) as input(item)
  loop
    row_number_value := (row_value ->> 'row_number')::integer;
    occurred_on_value := (row_value ->> 'occurred_on')::date;
    description_value := trim(row_value ->> 'description');
    amount_cents_value := (row_value ->> 'amount_cents')::bigint;
    transaction_type_value := row_value ->> 'transaction_type';
    fingerprint_value := trim(row_value ->> 'import_fingerprint');

    if row_number_value is null
      or row_number_value <= 0
      or occurred_on_value is null
      or char_length(description_value) not between 1 and 120
      or amount_cents_value is null
      or amount_cents_value <= 0
      or transaction_type_value not in ('income', 'expense')
      or char_length(fingerprint_value) not between 1 and 512
    then
      raise exception 'invalid import row';
    end if;

    transaction_id_value := null;
    insert into public.transactions (
      user_id,
      account_id,
      transaction_type,
      amount_cents,
      occurred_on,
      due_on,
      status,
      description,
      category_id,
      transfer_account_id,
      import_batch_id,
      import_fingerprint,
      source
    )
    values (
      current_user_id,
      account_id_input,
      transaction_type_value,
      amount_cents_value,
      occurred_on_value,
      null,
      'cleared',
      description_value,
      case
        when transaction_type_value = 'income' then income_category_id
        else expense_category_id
      end,
      null,
      batch_id_value,
      fingerprint_value,
      'bank_import'
    )
    on conflict (user_id, account_id, import_fingerprint)
      where import_fingerprint is not null
    do nothing
    returning id into transaction_id_value;

    if transaction_id_value is null then
      duplicate_count_value := duplicate_count_value + 1;
    else
      imported_count_value := imported_count_value + 1;
    end if;

    insert into public.import_batch_rows (
      user_id,
      batch_id,
      transaction_id,
      row_number,
      occurred_on,
      description,
      signed_amount_cents,
      transaction_type,
      import_fingerprint,
      review_status
    )
    values (
      current_user_id,
      batch_id_value,
      transaction_id_value,
      row_number_value,
      occurred_on_value,
      description_value,
      case
        when transaction_type_value = 'income' then amount_cents_value
        else -amount_cents_value
      end,
      transaction_type_value,
      fingerprint_value,
      case
        when transaction_id_value is null then 'duplicate'
        else 'imported'
      end
    );
  end loop;

  update public.import_batches
  set
    status = 'completed',
    imported_count = imported_count_value,
    duplicate_count = duplicate_count_value
  where id = batch_id_value
    and user_id = current_user_id;

  return query
    select imported_count_value, duplicate_count_value;
end;
$$;

revoke all on function public.confirm_statement_import(
  uuid,
  text,
  text,
  text,
  jsonb
) from public, anon;
grant execute on function public.confirm_statement_import(
  uuid,
  text,
  text,
  text,
  jsonb
) to authenticated;

drop policy expenses_insert_own on public.expenses;
drop policy expenses_update_own on public.expenses;
drop policy expenses_delete_own on public.expenses;
revoke all on public.expenses from public, anon, authenticated;
grant select on public.expenses to authenticated;
