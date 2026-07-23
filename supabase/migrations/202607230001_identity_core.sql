create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'BRL' check (currency = 'BRL'),
  locale text not null default 'pt-BR' check (locale = 'pt-BR'),
  timezone text not null default 'America/Bahia' check (char_length(timezone) between 1 and 80),
  week_starts_on smallint not null default 0 check (week_starts_on between 0 and 6),
  email_reminders boolean not null default true,
  ai_processing_consent boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default timezone('utc', now()),
  actor text not null check (actor in ('user', 'system', 'assistant')),
  action text not null check (char_length(action) between 1 and 100),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text,
  result text not null check (result in ('success', 'failure')),
  metadata jsonb not null default '{}'::jsonb
);

create index audit_events_user_occurred_idx
on public.audit_events (user_id, occurred_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger preferences_set_updated_at
before update on public.preferences
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_name text;
begin
  chosen_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pessoa'
    ),
    80
  );

  insert into public.profiles (user_id, display_name)
  values (new.id, chosen_name);

  insert into public.preferences (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function public.complete_onboarding(
  display_name_input text,
  timezone_input text,
  email_reminders_input boolean,
  ai_consent_input boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_name text := trim(display_name_input);
  normalized_timezone text := trim(timezone_input);
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if char_length(normalized_name) not between 1 and 80 then
    raise exception 'invalid display name';
  end if;

  if char_length(normalized_timezone) not between 1 and 80 then
    raise exception 'invalid timezone';
  end if;

  update public.profiles
  set display_name = normalized_name, onboarding_completed = true
  where user_id = current_user_id;

  update public.preferences
  set timezone = normalized_timezone,
      email_reminders = email_reminders_input,
      ai_processing_consent = ai_consent_input
  where user_id = current_user_id;

  insert into public.audit_events (
    user_id, actor, action, entity_type, entity_id, result
  )
  values (
    current_user_id,
    'user',
    'identity.onboarding.completed',
    'profile',
    current_user_id::text,
    'success'
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_insert_own on public.profiles
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy preferences_select_own on public.preferences
for select to authenticated
using ((select auth.uid()) = user_id);

create policy preferences_insert_own on public.preferences
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy preferences_update_own on public.preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy audit_events_select_own on public.audit_events
for select to authenticated
using ((select auth.uid()) = user_id);

create policy audit_events_insert_own on public.audit_events
for insert to authenticated
with check ((select auth.uid()) = user_id);

revoke all on public.profiles, public.preferences, public.audit_events from public, anon, authenticated;
grant select, insert, update on public.profiles, public.preferences to authenticated;
grant select, insert on public.audit_events to authenticated;
revoke all on function public.complete_onboarding(text, text, boolean, boolean) from public, anon;
grant execute on function public.complete_onboarding(text, text, boolean, boolean) to authenticated;
