begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public', 'expenses', 'legacy expenses table still exists');
select col_type_is(
  'public',
  'expenses',
  'user_id',
  'uuid',
  'legacy expenses still belong to a user'
);
select col_type_is(
  'public',
  'expenses',
  'amount',
  'numeric(12,2)',
  'legacy values retain their original exact type'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.expenses'::regclass),
  true,
  'legacy expenses retain RLS'
);
select policies_are(
  'public',
  'expenses',
  array['expenses_select_own'],
  'legacy expenses expose owner-only reads'
);
select ok(
  not has_table_privilege('anon', 'public.expenses', 'SELECT'),
  'anonymous users cannot read legacy expenses'
);
select ok(
  not has_table_privilege('authenticated', 'public.expenses', 'INSERT')
    and not has_table_privilege('authenticated', 'public.expenses', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.expenses', 'DELETE'),
  'authenticated users cannot mutate legacy expenses'
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

insert into public.expenses (
  user_id,
  expense_type,
  description,
  category,
  amount,
  expense_date
)
values (
  '30000000-0000-0000-0000-000000000003',
  'variable',
  'Mercado legado',
  'Alimentação',
  246.90,
  '2026-07-20'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000003',
  true
);
select is(
  (select count(*) from public.expenses),
  1::bigint,
  'the owner can reconcile legacy expenses'
);
select throws_ok(
  $$
    insert into public.expenses (
      user_id, expense_type, description, category, amount, expense_date
    )
    values (
      '30000000-0000-0000-0000-000000000003',
      'variable',
      'Blocked',
      'Outros',
      1.00,
      '2026-07-20'
    )
  $$,
  '42501',
  null,
  'the owner cannot add legacy expenses'
);

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000004',
  true
);
select is(
  (select count(*) from public.expenses),
  0::bigint,
  'another identity cannot read legacy expenses'
);

select * from finish();
rollback;
