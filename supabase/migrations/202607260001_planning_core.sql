create table public.planning_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  color text not null default '#FFE5D5' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 4000),
  color text not null default '#FCE1E8' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'archived')),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  constraint projects_area_fk foreign key (area_id, user_id)
    references public.planning_areas (id, user_id),
  constraint projects_range_check check (
    ends_on is null or starts_on is null or ends_on >= starts_on
  )
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid,
  parent_task_id uuid,
  carried_from_task_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 240),
  notes text check (notes is null or char_length(notes) <= 10000),
  status text not null default 'inbox'
    check (status in ('inbox', 'planned', 'completed', 'cancelled')),
  priority text not null default 'none'
    check (priority in ('none', 'low', 'medium', 'high')),
  due_at timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  estimated_minutes integer
    check (estimated_minutes is null or estimated_minutes between 1 and 1440),
  recurrence_rule text check (
    recurrence_rule is null
    or recurrence_rule ~ '^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[A-Z0-9,+-]+)*$'
  ),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  constraint tasks_project_fk foreign key (project_id, user_id)
    references public.projects (id, user_id),
  constraint tasks_parent_fk foreign key (parent_task_id, user_id)
    references public.tasks (id, user_id),
  constraint tasks_carried_from_fk foreign key (carried_from_task_id, user_id)
    references public.tasks (id, user_id),
  constraint tasks_schedule_check check (
    (scheduled_start is null and scheduled_end is null)
    or (
      scheduled_start is not null
      and scheduled_end is not null
      and scheduled_end > scheduled_start
    )
  ),
  constraint tasks_completion_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  constraint tasks_not_own_parent check (parent_task_id is distinct from id)
);

create table public.task_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  link_type text not null
    check (link_type in ('event', 'goal', 'note', 'project')),
  linked_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint task_links_task_fk foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete cascade,
  unique (user_id, task_id, link_type, linked_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_event_id uuid,
  source text not null default 'local'
    check (source in ('local', 'google', 'outlook')),
  external_id text,
  event_type text not null default 'event'
    check (event_type in ('event', 'task', 'bill', 'trip')),
  title text not null check (char_length(trim(title)) between 1 and 240),
  notes text check (notes is null or char_length(notes) <= 10000),
  location text check (location is null or char_length(location) <= 500),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  timezone text not null default 'America/Bahia'
    check (char_length(timezone) between 1 and 80),
  recurrence_rule text check (
    recurrence_rule is null
    or recurrence_rule ~ '^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[A-Z0-9,+-]+)*$'
  ),
  trip_starts_on date,
  trip_ends_on date,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  constraint events_parent_fk foreign key (parent_event_id, user_id)
    references public.events (id, user_id) on delete cascade,
  constraint events_range_check check (ends_at > starts_at),
  constraint events_trip_range_check check (
    (event_type = 'trip' and trip_starts_on is not null and trip_ends_on >= trip_starts_on)
    or (event_type <> 'trip' and trip_starts_on is null and trip_ends_on is null)
  ),
  constraint events_external_source_check check (
    (source = 'local' and external_id is null)
    or (source <> 'local' and external_id is not null)
  ),
  constraint events_not_own_parent check (parent_event_id is distinct from id),
  unique (user_id, source, external_id)
);

create table public.event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  link_type text not null
    check (link_type in ('task', 'goal', 'note', 'project')),
  linked_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint event_links_event_fk foreign key (event_id, user_id)
    references public.events (id, user_id) on delete cascade,
  unique (user_id, event_id, link_type, linked_id)
);

create index tasks_today_idx
on public.tasks (user_id, status, scheduled_start, due_at)
where status in ('inbox', 'planned');
create index tasks_upcoming_idx
on public.tasks (user_id, due_at, priority desc)
where status in ('inbox', 'planned');
create index tasks_project_idx
on public.tasks (user_id, project_id, status, due_at);
create index tasks_parent_idx
on public.tasks (user_id, parent_task_id)
where parent_task_id is not null;
create index events_calendar_idx
on public.events (user_id, starts_at, ends_at);
create index events_parent_idx
on public.events (user_id, parent_event_id, starts_at)
where parent_event_id is not null;

create trigger planning_areas_set_updated_at
before update on public.planning_areas
for each row execute function private.set_updated_at();
create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();
create trigger events_set_updated_at
before update on public.events
for each row execute function private.set_updated_at();

alter table public.planning_areas enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_links enable row level security;
alter table public.events enable row level security;
alter table public.event_links enable row level security;

create policy planning_areas_own on public.planning_areas
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy projects_own on public.projects
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy tasks_own on public.tasks
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy task_links_own on public.task_links
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy events_own on public.events
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy event_links_own on public.event_links
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function private.rrule_frequency(rule text)
returns interval
language sql
immutable
set search_path = ''
as $$
  select case substring(rule from 'FREQ=([A-Z]+)')
    when 'DAILY' then interval '1 day'
    when 'WEEKLY' then interval '1 week'
    when 'MONTHLY' then interval '1 month'
    when 'YEARLY' then interval '1 year'
  end
  * coalesce(nullif(substring(rule from 'INTERVAL=([0-9]+)'), '')::integer, 1);
$$;

create or replace function private.rrule_count(rule text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select least(
    coalesce(nullif(substring(rule from 'COUNT=([0-9]+)'), '')::integer, 1000),
    1000
  );
$$;

create or replace function public.planning_occurrences(
  window_start timestamptz,
  window_end timestamptz
)
returns table (
  id text,
  source_id uuid,
  kind text,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean,
  location text,
  source text,
  last_synced_at timestamptz,
  estimated_minutes integer,
  parent_event_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if window_end <= window_start
    or window_end - window_start > interval '366 days'
  then
    raise exception 'occurrence window must be between 1 second and 366 days'
      using errcode = '22023';
  end if;

  return query
  with recurring_events as (
    select
      event.*,
      occurrence.index,
      event.starts_at + (
        coalesce(private.rrule_frequency(event.recurrence_rule), interval '0')
        * occurrence.index
      ) as occurrence_start
    from public.events event
    cross join lateral generate_series(
      0,
      case
        when event.recurrence_rule is null then 0
        else private.rrule_count(event.recurrence_rule) - 1
      end
    ) occurrence(index)
    where event.user_id = (select auth.uid())
  ),
  recurring_tasks as (
    select
      task.*,
      occurrence.index,
      coalesce(task.scheduled_start, task.due_at) + (
        coalesce(private.rrule_frequency(task.recurrence_rule), interval '0')
        * occurrence.index
      ) as occurrence_start
    from public.tasks task
    cross join lateral generate_series(
      0,
      case
        when task.recurrence_rule is null then 0
        else private.rrule_count(task.recurrence_rule) - 1
      end
    ) occurrence(index)
    where task.user_id = (select auth.uid())
      and task.status in ('inbox', 'planned')
      and coalesce(task.scheduled_start, task.due_at) is not null
  )
  select
    event.id::text || ':' || event.index::text,
    event.id,
    event.event_type,
    event.title,
    event.occurrence_start,
    event.occurrence_start + (event.ends_at - event.starts_at),
    event.all_day,
    event.location,
    event.source,
    event.last_synced_at,
    null::integer,
    event.parent_event_id
  from recurring_events event
  where event.occurrence_start < window_end
    and event.occurrence_start + (event.ends_at - event.starts_at) > window_start

  union all

  select
    task.id::text || ':' || task.index::text,
    task.id,
    'task'::text,
    task.title,
    task.occurrence_start,
    task.occurrence_start + coalesce(
      task.scheduled_end - task.scheduled_start,
      make_interval(mins => coalesce(task.estimated_minutes, 30))
    ),
    false,
    null::text,
    'local'::text,
    null::timestamptz,
    task.estimated_minutes,
    null::uuid
  from recurring_tasks task
  where task.occurrence_start < window_end
    and task.occurrence_start + coalesce(
      task.scheduled_end - task.scheduled_start,
      make_interval(mins => coalesce(task.estimated_minutes, 30))
    ) > window_start

  union all

  select
    transaction.id::text || ':bill',
    transaction.id,
    'bill'::text,
    transaction.description,
    transaction.due_on::timestamp + time '17:00',
    transaction.due_on::timestamp + time '17:30',
    false,
    null::text,
    transaction.source,
    null::timestamptz,
    null::integer,
    null::uuid
  from public.transactions transaction
  where transaction.user_id = (select auth.uid())
    and transaction.transaction_type = 'expense'
    and transaction.status = 'planned'
    and transaction.due_on is not null
    and transaction.due_on::timestamp + time '17:00' >= window_start
    and transaction.due_on::timestamp + time '17:00' < window_end

  order by 5, 4;
end;
$$;

create or replace function public.transition_task(task_id_input uuid, action_input text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  previous public.tasks%rowtype;
  user_timezone text;
  tomorrow_start timestamptz;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;
  if action_input not in ('complete', 'undo', 'postpone', 'tomorrow') then
    raise exception 'invalid task transition' using errcode = '22023';
  end if;

  select *
  into previous
  from public.tasks
  where id = task_id_input and user_id = current_user_id
  for update;
  if not found then
    raise exception 'task not found' using errcode = 'P0002';
  end if;

  if action_input = 'complete' then
    update public.tasks
    set status = 'completed', completed_at = timezone('utc', now())
    where id = task_id_input and user_id = current_user_id;
  elsif action_input = 'undo' then
    update public.tasks
    set status = 'planned', completed_at = null
    where id = task_id_input and user_id = current_user_id;
  elsif action_input = 'postpone' then
    update public.tasks
    set
      due_at = coalesce(due_at, timezone('utc', now())) + interval '1 day',
      scheduled_start = scheduled_start + interval '1 day',
      scheduled_end = scheduled_end + interval '1 day'
    where id = task_id_input and user_id = current_user_id;
  else
    select coalesce(preference.timezone, 'America/Bahia')
    into user_timezone
    from public.preferences preference
    where preference.user_id = current_user_id;
    tomorrow_start := (
      date_trunc('day', now() at time zone coalesce(user_timezone, 'America/Bahia'))
      + interval '1 day 9 hours'
    ) at time zone coalesce(user_timezone, 'America/Bahia');
    update public.tasks
    set
      due_at = tomorrow_start,
      scheduled_start = case
        when scheduled_start is null then null
        else tomorrow_start
      end,
      scheduled_end = case
        when scheduled_start is null then null
        else tomorrow_start + (scheduled_end - scheduled_start)
      end
    where id = task_id_input and user_id = current_user_id;
  end if;

  insert into public.audit_events (
    user_id, actor, action, entity_type, entity_id, result, metadata
  )
  values (
    current_user_id,
    'user',
    'task.' || action_input,
    'task',
    task_id_input::text,
    'success',
    jsonb_build_object(
      'previous_status', previous.status,
      'previous_due_at', previous.due_at
    )
  );
end;
$$;

revoke all on public.planning_areas, public.projects, public.tasks,
  public.task_links, public.events, public.event_links
from public, anon, authenticated;
grant select, insert, update, delete on public.planning_areas, public.projects,
  public.tasks, public.task_links, public.events, public.event_links
to authenticated;
revoke all on function public.planning_occurrences(timestamptz, timestamptz)
from public, anon;
grant execute on function public.planning_occurrences(timestamptz, timestamptz)
to authenticated;
revoke all on function public.transition_task(uuid, text) from public, anon;
grant execute on function public.transition_task(uuid, text) to authenticated;
