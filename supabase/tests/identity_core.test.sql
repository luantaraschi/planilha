begin;

create extension if not exists pgtap with schema extensions;
select plan(25);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'preferences', 'preferences table exists');
select has_table('public', 'audit_events', 'audit_events table exists');
select col_type_is('public', 'profiles', 'user_id', 'uuid', 'profile ownership uses uuid');
select col_type_is('public', 'preferences', 'currency', 'text', 'currency is text');
select col_default_is('public', 'preferences', 'currency', 'BRL', 'currency defaults to BRL');
select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'profiles has RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.preferences'::regclass),
  true,
  'preferences has RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass),
  true,
  'audit events has RLS'
);
select policies_are(
  'public',
  'profiles',
  array['profiles_insert_own', 'profiles_select_own', 'profiles_update_own'],
  'profiles has owner-only policies'
);
select policies_are(
  'public',
  'preferences',
  array['preferences_insert_own', 'preferences_select_own', 'preferences_update_own'],
  'preferences has owner-only policies'
);
select policies_are(
  'public',
  'audit_events',
  array['audit_events_insert_own', 'audit_events_select_own'],
  'audit log cannot be changed or deleted through the API'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'TRUNCATE'),
  'authenticated cannot truncate profiles'
);
select ok(
  not has_table_privilege('authenticated', 'public.preferences', 'TRUNCATE'),
  'authenticated cannot truncate preferences'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'TRUNCATE'),
  'authenticated cannot truncate audit events'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.complete_onboarding(text,text,boolean,boolean)',
    'EXECUTE'
  ),
  'anon cannot execute onboarding'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.complete_onboarding(text,text,boolean,boolean)',
    'EXECUTE'
  ),
  'authenticated can execute onboarding'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'isolation-one@example.test',
    '{"display_name":"Identity One"}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'isolation-two@example.test',
    '{"display_name":"Identity Two"}'::jsonb
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select is(
  (
    select count(*)
    from public.profiles
    where user_id = '20000000-0000-0000-0000-000000000002'
  ),
  0::bigint,
  'first identity cannot select the second profile'
);
select is(
  (
    select count(*)
    from public.preferences
    where user_id = '20000000-0000-0000-0000-000000000002'
  ),
  0::bigint,
  'first identity cannot select the second preferences'
);
select is_empty(
  $$
    update public.profiles
    set display_name = 'Cross-user write'
    where user_id = '20000000-0000-0000-0000-000000000002'
    returning 1
  $$,
  'first identity cannot update the second profile'
);
select is_empty(
  $$
    update public.preferences
    set email_reminders = false
    where user_id = '20000000-0000-0000-0000-000000000002'
    returning 1
  $$,
  'first identity cannot update the second preferences'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000002',
  true
);

select is(
  (
    select count(*)
    from public.profiles
    where user_id = '10000000-0000-0000-0000-000000000001'
  ),
  0::bigint,
  'second identity cannot select the first profile'
);
select is(
  (
    select count(*)
    from public.preferences
    where user_id = '10000000-0000-0000-0000-000000000001'
  ),
  0::bigint,
  'second identity cannot select the first preferences'
);
select is_empty(
  $$
    update public.profiles
    set display_name = 'Cross-user write'
    where user_id = '10000000-0000-0000-0000-000000000001'
    returning 1
  $$,
  'second identity cannot update the first profile'
);
select is_empty(
  $$
    update public.preferences
    set email_reminders = false
    where user_id = '10000000-0000-0000-0000-000000000001'
    returning 1
  $$,
  'second identity cannot update the first preferences'
);

select * from finish();
rollback;
