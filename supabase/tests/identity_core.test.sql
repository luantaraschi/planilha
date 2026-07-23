begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

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

select * from finish();
rollback;
