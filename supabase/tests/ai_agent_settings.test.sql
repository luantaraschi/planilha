begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table(
  'public',
  'ai_agent_settings',
  'AI agent settings table exists'
);
select col_is_pk(
  'public',
  'ai_agent_settings',
  'user_id',
  'one AI agent configuration exists per user'
);
select col_type_is(
  'public',
  'ai_agent_settings',
  'provider',
  'text',
  'provider is explicit'
);
select has_column(
  'public',
  'ai_agent_settings',
  'encrypted_api_key',
  'the encrypted API key is stored'
);
select has_column(
  'public',
  'ai_agent_settings',
  'api_key_iv',
  'the encryption IV is stored'
);
select has_column(
  'public',
  'ai_agent_settings',
  'api_key_auth_tag',
  'the authentication tag is stored'
);
select is(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.ai_agent_settings'::regclass
  ),
  true,
  'AI agent settings has RLS'
);
select policies_are(
  'public',
  'ai_agent_settings',
  array[
    'ai_agent_settings_delete_own',
    'ai_agent_settings_insert_own',
    'ai_agent_settings_select_own',
    'ai_agent_settings_update_own'
  ],
  'AI agent settings has owner-only policies'
);
select ok(
  not has_table_privilege('anon', 'public.ai_agent_settings', 'SELECT'),
  'anonymous users cannot read AI settings'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.ai_agent_settings',
    'TRUNCATE'
  ),
  'authenticated users cannot truncate AI settings'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '50000000-0000-0000-0000-000000000005',
    'agent-one@example.test',
    '{"display_name":"Agent One"}'::jsonb
  ),
  (
    '60000000-0000-0000-0000-000000000006',
    'agent-two@example.test',
    '{"display_name":"Agent Two"}'::jsonb
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '50000000-0000-0000-0000-000000000005',
  true
);

select lives_ok(
  $$
    insert into public.ai_agent_settings (
      user_id,
      provider,
      model,
      encrypted_api_key,
      api_key_iv,
      api_key_auth_tag,
      api_key_hint
    )
    values (
      '50000000-0000-0000-0000-000000000005',
      'openai',
      'gpt-5.6-luna',
      'encrypted',
      'iv',
      'tag',
      '1234'
    )
  $$,
  'a user can save their own AI agent settings'
);

select set_config(
  'request.jwt.claim.sub',
  '60000000-0000-0000-0000-000000000006',
  true
);

select is(
  (select count(*) from public.ai_agent_settings),
  0::bigint,
  'another user cannot read the saved AI settings'
);
select is_empty(
  $$
    update public.ai_agent_settings
    set model = 'gpt-5.6-sol'
    returning 1
  $$,
  'another user cannot change the saved AI settings'
);

select * from finish();
rollback;
