begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select has_table('public', 'expenses', 'expenses table exists');
select col_type_is('public', 'expenses', 'user_id', 'uuid', 'expenses belong to a user');
select col_type_is(
  'public',
  'expenses',
  'amount',
  'numeric(12,2)',
  'amount uses exact numeric values'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.expenses'::regclass),
  true,
  'expenses has RLS'
);
select policies_are(
  'public',
  'expenses',
  array[
    'expenses_delete_own',
    'expenses_insert_own',
    'expenses_select_own',
    'expenses_update_own'
  ],
  'expenses has owner-only policies'
);
select ok(
  not has_table_privilege('anon', 'public.expenses', 'SELECT'),
  'anonymous users cannot read expenses'
);
select ok(
  not has_table_privilege('authenticated', 'public.expenses', 'TRUNCATE'),
  'authenticated users cannot truncate expenses'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '30000000-0000-0000-0000-000000000003',
    'finance-one@example.test',
    '{"display_name":"Finance One"}'::jsonb
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    'finance-two@example.test',
    '{"display_name":"Finance Two"}'::jsonb
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000003',
  true
);

select lives_ok(
  $$
    insert into public.expenses (
      user_id, expense_type, description, category, amount, expense_date, due_day
    )
    values (
      '30000000-0000-0000-0000-000000000003',
      'fixed',
      'Aluguel',
      'Moradia',
      1800.00,
      '2026-07-05',
      5
    )
  $$,
  'first identity can insert a fixed expense'
);
select lives_ok(
  $$
    insert into public.expenses (
      user_id, expense_type, description, category, amount, expense_date
    )
    values (
      '30000000-0000-0000-0000-000000000003',
      'variable',
      'Mercado',
      'Alimentação',
      246.90,
      '2026-07-20'
    )
  $$,
  'first identity can insert a variable expense'
);
select is(
  (select count(*) from public.expenses),
  2::bigint,
  'first identity can read its expenses'
);
select results_eq(
  $$
    update public.expenses
    set amount = 250.00
    where description = 'Mercado'
    returning amount
  $$,
  $$ values (250.00::numeric) $$,
  'first identity can update its expense'
);

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000004',
  true
);

select is(
  (select count(*) from public.expenses),
  0::bigint,
  'second identity cannot read the first expenses'
);
select is_empty(
  $$
    update public.expenses
    set amount = 1.00
    returning 1
  $$,
  'second identity cannot update the first expenses'
);
select is_empty(
  $$
    delete from public.expenses
    returning 1
  $$,
  'second identity cannot delete the first expenses'
);

select * from finish();
rollback;
