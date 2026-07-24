begin;

create extension if not exists pgtap with schema extensions;
select plan(42);

select has_table('public', 'financial_accounts', 'financial accounts exist');
select has_table('public', 'financial_categories', 'financial categories exist');
select has_table('public', 'transactions', 'transactions exist');
select has_table('public', 'recurring_entries', 'recurring entries exist');
select has_table('public', 'import_batches', 'import batches exist');
select has_table('public', 'import_batch_rows', 'import review rows exist');
select has_table('public', 'budgets', 'budgets exist');
select has_table('public', 'financial_goals', 'financial goals exist');

select col_type_is(
  'public',
  'transactions',
  'amount_cents',
  'bigint',
  'transaction money uses integer cents'
);
select col_type_is(
  'public',
  'recurring_entries',
  'due_day',
  'smallint',
  'recurring entries preserve their calendar anchor'
);
select has_function(
  'public',
  'confirm_statement_import',
  array['uuid', 'text', 'text', 'text', 'jsonb'],
  'statement confirmation RPC exists'
);
select col_has_default(
  'public',
  'import_batch_rows',
  'created_at',
  'immutable import rows record when they were reviewed'
);
select has_trigger(
  'public',
  'import_batches',
  'import_batches_set_updated_at',
  'mutable batch completion timestamps are maintained'
);

select is(
  (
    select count(*)
    from pg_class
    where oid in (
      'public.financial_accounts'::regclass,
      'public.financial_categories'::regclass,
      'public.transactions'::regclass,
      'public.recurring_entries'::regclass,
      'public.import_batches'::regclass,
      'public.import_batch_rows'::regclass,
      'public.budgets'::regclass,
      'public.financial_goals'::regclass
    )
      and relrowsecurity
  ),
  8::bigint,
  'every financial table has RLS'
);

select ok(
  not has_table_privilege('anon', 'public.transactions', 'SELECT'),
  'anonymous users cannot read transactions'
);
select ok(
  not has_table_privilege('authenticated', 'public.transactions', 'TRUNCATE'),
  'authenticated users cannot truncate transactions'
);
select ok(
  not has_table_privilege('authenticated', 'public.expenses', 'INSERT'),
  'legacy expenses are read-only'
);
select ok(
  not has_table_privilege('authenticated', 'public.import_batches', 'INSERT'),
  'identities cannot insert import batches outside the RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.import_batches', 'UPDATE'),
  'identities cannot update import batches outside the RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.import_batches', 'DELETE'),
  'identities cannot delete import batches outside the RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.import_batch_rows', 'INSERT'),
  'identities cannot insert import history rows outside the RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.import_batch_rows', 'UPDATE'),
  'identities cannot update import history rows outside the RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.import_batch_rows', 'DELETE'),
  'identities cannot delete import history rows outside the RPC'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '51000000-0000-0000-0000-000000000001',
    'ledger-one@example.test',
    '{"display_name":"Ledger One"}'::jsonb
  ),
  (
    '52000000-0000-0000-0000-000000000002',
    'ledger-two@example.test',
    '{"display_name":"Ledger Two"}'::jsonb
  );

select is(
  (
    select count(*)
    from public.financial_accounts
    where user_id = '51000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'new identities receive a default account'
);
select is(
  (
    select count(*)
    from public.financial_categories
    where user_id = '51000000-0000-0000-0000-000000000001'
  ),
  11::bigint,
  'new identities receive useful default categories'
);

create temporary table other_identity_account as
select id
from public.financial_accounts
where user_id = '52000000-0000-0000-0000-000000000002';
grant select on other_identity_account to authenticated;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '51000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$
    insert into public.transactions (
      user_id,
      account_id,
      transaction_type,
      amount_cents,
      occurred_on,
      status,
      description,
      category_id
    )
    select
      '51000000-0000-0000-0000-000000000001',
      account.id,
      'expense',
      8240,
      '2026-07-20',
      'cleared',
      'Mercado',
      category.id
    from public.financial_accounts account
    cross join public.financial_categories category
    where account.user_id = '51000000-0000-0000-0000-000000000001'
      and category.user_id = account.user_id
      and category.name = 'Alimentação'
  $$,
  'an identity can create its own transaction'
);
select is(
  (select count(*) from public.transactions),
  1::bigint,
  'an identity can read its own transaction'
);
select throws_ok(
  $$
    insert into public.transactions (
      user_id,
      account_id,
      transaction_type,
      amount_cents,
      occurred_on,
      status,
      description
    )
    select
      '51000000-0000-0000-0000-000000000001',
      account.id,
      'expense',
      100,
      '2026-07-20',
      'cleared',
      'Cross-user account'
    from other_identity_account account
  $$,
  '23503',
  null,
  'a transaction cannot reference another identity account'
);
select throws_ok(
  $$
    insert into public.transactions (
      user_id,
      account_id,
      transaction_type,
      amount_cents,
      occurred_on,
      status,
      description
    )
    select
      '51000000-0000-0000-0000-000000000001',
      account.id,
      'transfer',
      500,
      '2026-07-20',
      'cleared',
      'Invalid transfer'
    from public.financial_accounts account
    where account.user_id = '51000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  null,
  'a transfer requires a destination account'
);
select lives_ok(
  $$
    with new_account as (
      insert into public.financial_accounts (user_id, name, account_type)
      values (
        '51000000-0000-0000-0000-000000000001',
        'Reserva',
        'savings'
      )
      returning id
    )
    insert into public.transactions (
      user_id,
      account_id,
      transaction_type,
      amount_cents,
      occurred_on,
      status,
      description,
      transfer_account_id
    )
    select
      '51000000-0000-0000-0000-000000000001',
      source.id,
      'transfer',
      50000,
      '2026-07-21',
      'cleared',
      'Guardar na reserva',
      destination.id
    from public.financial_accounts source
    cross join new_account destination
    where source.user_id = '51000000-0000-0000-0000-000000000001'
      and source.name = 'Conta principal'
  $$,
  'a valid transfer is stored once'
);
select is(
  (
    select count(*)
    from public.transactions
    where transaction_type = 'transfer'
  ),
  1::bigint,
  'a transfer has one auditable ledger record'
);

create temporary table first_import_result as
select *
from public.confirm_statement_import(
  (
    select id
    from public.financial_accounts
    where user_id = '51000000-0000-0000-0000-000000000001'
      and name = 'Conta principal'
  ),
  'extrato.csv',
  'csv',
  'confirmation-key-1',
  jsonb_build_array(
    jsonb_build_object(
      'row_number', 2,
      'occurred_on', '2026-07-22',
      'description', 'Pix recebido',
      'amount_cents', 20000,
      'transaction_type', 'income',
      'import_fingerprint', 'same-fingerprint'
    ),
    jsonb_build_object(
      'row_number', 3,
      'occurred_on', '2026-07-22',
      'description', 'Pix recebido repetido',
      'amount_cents', 20000,
      'transaction_type', 'income',
      'import_fingerprint', 'same-fingerprint'
    )
  )
);

select results_eq(
  'select imported_count, duplicate_count from first_import_result',
  'values (1, 1)',
  'atomic confirmation imports one row and reviews its duplicate'
);

create temporary table repeated_import_result as
select *
from public.confirm_statement_import(
  (
    select id
    from public.financial_accounts
    where user_id = '51000000-0000-0000-0000-000000000001'
      and name = 'Conta principal'
  ),
  'extrato.csv',
  'csv',
  'confirmation-key-1',
  jsonb_build_array(
    jsonb_build_object(
      'row_number', 2,
      'occurred_on', '2026-07-22',
      'description', 'Pix recebido',
      'amount_cents', 20000,
      'transaction_type', 'income',
      'import_fingerprint', 'same-fingerprint'
    ),
    jsonb_build_object(
      'row_number', 3,
      'occurred_on', '2026-07-22',
      'description', 'Pix recebido repetido',
      'amount_cents', 20000,
      'transaction_type', 'income',
      'import_fingerprint', 'same-fingerprint'
    )
  )
);

select results_eq(
  'select imported_count, duplicate_count from repeated_import_result',
  'values (1, 1)',
  'repeating a confirmation returns the original result'
);
select is(
  (
    select count(*)
    from public.import_batches
    where confirmation_key = 'confirmation-key-1'
  ),
  1::bigint,
  'idempotent confirmation creates one batch'
);
select is(
  (
    select count(*)
    from public.transactions
    where import_fingerprint = 'same-fingerprint'
  ),
  1::bigint,
  'idempotent confirmation creates one transaction'
);
select is(
  (
    select count(*)
    from public.import_batch_rows
    where import_fingerprint = 'same-fingerprint'
  ),
  2::bigint,
  'the immutable review keeps both source rows'
);

select throws_ok(
  $$
    select *
    from public.confirm_statement_import(
      (
        select id
        from public.financial_accounts
        where user_id = '51000000-0000-0000-0000-000000000001'
          and name = 'Conta principal'
      ),
      'invalido.csv',
      'csv',
      'confirmation-key-invalid',
      jsonb_build_array(
        jsonb_build_object(
          'row_number', 2,
          'occurred_on', '2026-07-23',
          'description', 'Linha inicialmente válida',
          'amount_cents', 1000,
          'transaction_type', 'expense',
          'import_fingerprint', 'rollback-fingerprint'
        ),
        jsonb_build_object(
          'row_number', 3,
          'occurred_on', '2026-07-23',
          'description', 'Linha inválida',
          'amount_cents', 0,
          'transaction_type', 'expense',
          'import_fingerprint', 'invalid-fingerprint'
        )
      )
    )
  $$,
  'P0001',
  'invalid import row',
  'an invalid reviewed row aborts the whole confirmation'
);
select is(
  (
    select count(*)
    from public.import_batches
    where confirmation_key = 'confirmation-key-invalid'
  ),
  0::bigint,
  'an aborted confirmation leaves no batch history'
);
select is(
  (
    select count(*)
    from public.transactions
    where import_fingerprint = 'rollback-fingerprint'
  ),
  0::bigint,
  'an aborted confirmation rolls back earlier transaction rows'
);

select set_config(
  'request.jwt.claim.sub',
  '52000000-0000-0000-0000-000000000002',
  true
);
select is(
  (select count(*) from public.transactions),
  0::bigint,
  'another identity cannot read ledger entries'
);
select is_empty(
  $$
    update public.transactions
    set description = 'Changed'
    returning 1
  $$,
  'another identity cannot update ledger entries'
);
select is_empty(
  $$
    delete from public.transactions
    returning 1
  $$,
  'another identity cannot delete ledger entries'
);

select * from finish();
rollback;
