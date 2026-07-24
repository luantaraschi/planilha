create table public.ai_agent_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'openai' check (provider = 'openai'),
  model text not null default 'gpt-5.6-luna'
    check (char_length(trim(model)) between 1 and 100),
  instructions text not null default ''
    check (char_length(instructions) <= 2000),
  enabled boolean not null default true,
  encrypted_api_key text,
  api_key_iv text,
  api_key_auth_tag text,
  api_key_hint text check (
    api_key_hint is null or char_length(api_key_hint) between 1 and 4
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (
      encrypted_api_key is null
      and api_key_iv is null
      and api_key_auth_tag is null
      and api_key_hint is null
    )
    or (
      encrypted_api_key is not null
      and api_key_iv is not null
      and api_key_auth_tag is not null
      and api_key_hint is not null
    )
  )
);

create trigger ai_agent_settings_set_updated_at
before update on public.ai_agent_settings
for each row execute function private.set_updated_at();

alter table public.ai_agent_settings enable row level security;

create policy ai_agent_settings_select_own
on public.ai_agent_settings
for select to authenticated
using ((select auth.uid()) = user_id);

create policy ai_agent_settings_insert_own
on public.ai_agent_settings
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy ai_agent_settings_update_own
on public.ai_agent_settings
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy ai_agent_settings_delete_own
on public.ai_agent_settings
for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.ai_agent_settings from public, anon, authenticated;
grant select, insert, update, delete
on public.ai_agent_settings
to authenticated;
