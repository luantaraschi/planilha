create or replace function private.is_supported_rrule(rule text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  component text;
  key_name text;
  value_text text;
  seen_keys text[] := array[]::text[];
begin
  if rule is null then
    return true;
  end if;
  if rule <> upper(rule) or rule !~ '^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[^;]+)*$' then
    return false;
  end if;

  foreach component in array string_to_array(rule, ';')
  loop
    key_name := split_part(component, '=', 1);
    value_text := split_part(component, '=', 2);
    if key_name = any(seen_keys) then
      return false;
    end if;
    seen_keys := array_append(seen_keys, key_name);

    if key_name = 'FREQ' then
      if value_text not in ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') then
        return false;
      end if;
    elsif key_name in ('INTERVAL', 'COUNT') then
      if value_text !~ '^[1-9][0-9]*$' then
        return false;
      end if;
    elsif key_name = 'UNTIL' then
      if value_text !~ '^[0-9]{8}T[0-9]{6}Z$' then
        return false;
      end if;
    elsif key_name = 'BYDAY' then
      if value_text !~ '^(MO|TU|WE|TH|FR|SA|SU)(,(MO|TU|WE|TH|FR|SA|SU))*$' then
        return false;
      end if;
    else
      return false;
    end if;
  end loop;

  return true;
end;
$$;

alter table public.tasks
drop constraint if exists tasks_recurrence_rule_check;
alter table public.tasks
add constraint tasks_recurrence_rule_check
check (private.is_supported_rrule(recurrence_rule));

alter table public.events
drop constraint if exists events_recurrence_rule_check;
alter table public.events
add constraint events_recurrence_rule_check
check (private.is_supported_rrule(recurrence_rule));

alter table public.tasks add column timezone text;
update public.tasks task
set timezone = preference.timezone
from public.preferences preference
where preference.user_id = task.user_id;
alter table public.tasks alter column timezone set not null;
alter table public.tasks
add constraint tasks_timezone_length_check
check (char_length(timezone) between 1 and 80);
alter table public.events alter column timezone drop default;

create or replace function private.apply_profile_timezone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_timezone text;
begin
  select preference.timezone
  into profile_timezone
  from public.preferences preference
  where preference.user_id = new.user_id;

  if not found then
    raise exception 'planning owner has no preferences'
      using errcode = '23503';
  end if;

  new.timezone := profile_timezone;
  return new;
end;
$$;

create trigger tasks_apply_profile_timezone
before insert or update of user_id, timezone on public.tasks
for each row execute function private.apply_profile_timezone();

create trigger events_apply_profile_timezone
before insert or update of user_id, timezone on public.events
for each row execute function private.apply_profile_timezone();

alter table public.task_links
drop constraint if exists task_links_link_type_check;
alter table public.task_links
add constraint task_links_link_type_check
check (link_type in ('event', 'project'));

alter table public.event_links
drop constraint if exists event_links_link_type_check;
alter table public.event_links
add constraint event_links_link_type_check
check (link_type in ('task', 'project'));

create or replace function private.validate_planning_link_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_exists boolean := false;
begin
  if (
    tg_table_name = 'task_links'
    and new.link_type not in ('event', 'project')
  ) or (
    tg_table_name = 'event_links'
    and new.link_type not in ('task', 'project')
  ) then
    return new;
  elsif tg_table_name = 'task_links' and new.link_type = 'event' then
    select exists(
      select 1 from public.events
      where id = new.linked_id and user_id = new.user_id
    ) into target_exists;
  elsif tg_table_name = 'task_links' and new.link_type = 'project' then
    select exists(
      select 1 from public.projects
      where id = new.linked_id and user_id = new.user_id
    ) into target_exists;
  elsif tg_table_name = 'event_links' and new.link_type = 'task' then
    select exists(
      select 1 from public.tasks
      where id = new.linked_id and user_id = new.user_id
    ) into target_exists;
  elsif tg_table_name = 'event_links' and new.link_type = 'project' then
    select exists(
      select 1 from public.projects
      where id = new.linked_id and user_id = new.user_id
    ) into target_exists;
  end if;

  if not target_exists then
    raise foreign_key_violation using
      message = 'planning link target does not exist for this user';
  end if;
  return new;
end;
$$;

create trigger task_links_validate_target
before insert or update of user_id, link_type, linked_id on public.task_links
for each row execute function private.validate_planning_link_target();

create trigger event_links_validate_target
before insert or update of user_id, link_type, linked_id on public.event_links
for each row execute function private.validate_planning_link_target();

alter table public.events
drop constraint if exists events_trip_range_check;
alter table public.events
add constraint events_trip_range_check check (
  (
    event_type = 'trip'
    and trip_starts_on is not null
    and trip_ends_on is not null
    and trip_ends_on >= trip_starts_on
  )
  or (
    event_type <> 'trip'
    and trip_starts_on is null
    and trip_ends_on is null
  )
);

create or replace function private.validate_itinerary_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_event_id is not null and not exists (
    select 1
    from public.events parent
    where parent.id = new.parent_event_id
      and parent.user_id = new.user_id
      and parent.event_type = 'trip'
  ) then
    raise check_violation using
      message = 'itinerary parent must be a same-user trip';
  end if;
  return new;
end;
$$;

create trigger events_validate_itinerary_parent
before insert or update of user_id, parent_event_id on public.events
for each row execute function private.validate_itinerary_parent();

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  scheduled_time time not null,
  days_of_week smallint[] not null default array[0,1,2,3,4,5,6]::smallint[]
    check (
      cardinality(days_of_week) between 1 and 7
      and days_of_week <@ array[0,1,2,3,4,5,6]::smallint[]
    ),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null,
  occurred_on date not null,
  status text not null check (status in ('completed', 'skipped')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint habit_logs_habit_fk foreign key (habit_id, user_id)
    references public.habits (id, user_id) on delete cascade,
  unique (habit_id, user_id, occurred_on)
);

create index habits_today_idx
on public.habits (user_id, active, scheduled_time);
create index habit_logs_user_date_idx
on public.habit_logs (user_id, occurred_on, habit_id);

create trigger habits_set_updated_at
before update on public.habits
for each row execute function private.set_updated_at();

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

create policy habits_own on public.habits
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy habit_logs_own on public.habit_logs
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.habits, public.habit_logs
from public, anon, authenticated;
grant select, insert, update, delete on public.habits, public.habit_logs
to authenticated;

create or replace function private.rrule_count(rule text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select nullif(substring(rule from 'COUNT=([0-9]+)'), '')::integer;
$$;

create or replace function private.rrule_until(rule text)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select case
    when substring(rule from 'UNTIL=([0-9]{8}T[0-9]{6}Z)') is null then null
    else make_timestamptz(
      substring(rule from 'UNTIL=([0-9]{4})')::integer,
      substring(rule from 'UNTIL=[0-9]{4}([0-9]{2})')::integer,
      substring(rule from 'UNTIL=[0-9]{6}([0-9]{2})')::integer,
      substring(rule from 'UNTIL=[0-9]{8}T([0-9]{2})')::integer,
      substring(rule from 'UNTIL=[0-9]{8}T[0-9]{2}([0-9]{2})')::integer,
      substring(rule from 'UNTIL=[0-9]{8}T[0-9]{4}([0-9]{2})')::double precision,
      'UTC'
    )
  end;
$$;

create or replace function private.rrule_occurrences(
  anchor timestamptz,
  time_zone text,
  rule text,
  expansion_end timestamptz
)
returns table (
  occurrence_index bigint,
  occurrence_start timestamptz
)
language plpgsql
stable
set search_path = ''
as $$
declare
  anchor_local timestamp := anchor at time zone time_zone;
  anchor_date date := anchor_local::date;
  final_date date := (expansion_end at time zone time_zone)::date;
  frequency text := substring(rule from 'FREQ=([A-Z]+)');
  recurrence_interval integer :=
    coalesce(nullif(substring(rule from 'INTERVAL=([0-9]+)'), '')::integer, 1);
  recurrence_count integer := private.rrule_count(rule);
  recurrence_until timestamptz := private.rrule_until(rule);
  by_day text := substring(rule from 'BYDAY=([A-Z,]+)');
begin
  if rule is null then
    if anchor < expansion_end then
      occurrence_index := 0;
      occurrence_start := anchor;
      return next;
    end if;
    return;
  end if;

  return query
  with candidate_days as (
    select generated.day::date as day
    from generate_series(
      anchor_date::timestamp,
      final_date::timestamp,
      interval '1 day'
    ) generated(day)
  ),
  calendar_matches as (
    select
      candidate.day,
      candidate.day::timestamp + anchor_local::time as local_start,
      extract(isodow from candidate.day)::integer as iso_day,
      candidate.day - anchor_date as day_offset,
      (
        extract(year from candidate.day)::integer
        - extract(year from anchor_date)::integer
      ) * 12
      + (
        extract(month from candidate.day)::integer
        - extract(month from anchor_date)::integer
      ) as month_offset,
      extract(year from candidate.day)::integer
        - extract(year from anchor_date)::integer as year_offset
    from candidate_days candidate
  ),
  matching_starts as (
    select
      match.local_start at time zone time_zone as resolved_start
    from calendar_matches match
    where
      (
        (
          frequency = 'DAILY'
          and mod(match.day_offset, recurrence_interval) = 0
          and (
            by_day is null
            or position(
              ',' || case match.iso_day
                when 1 then 'MO' when 2 then 'TU' when 3 then 'WE'
                when 4 then 'TH' when 5 then 'FR' when 6 then 'SA'
                else 'SU'
              end || ','
              in ',' || by_day || ','
            ) > 0
          )
        )
        or (
          frequency = 'WEEKLY'
          and mod(floor(match.day_offset::numeric / 7)::integer, recurrence_interval) = 0
          and (
            (
              by_day is null
              and match.iso_day = extract(isodow from anchor_date)::integer
            )
            or (
              by_day is not null
              and position(
                ',' || case match.iso_day
                  when 1 then 'MO' when 2 then 'TU' when 3 then 'WE'
                  when 4 then 'TH' when 5 then 'FR' when 6 then 'SA'
                  else 'SU'
                end || ','
                in ',' || by_day || ','
              ) > 0
            )
          )
        )
        or (
          frequency = 'MONTHLY'
          and mod(match.month_offset, recurrence_interval) = 0
          and (
            (
              by_day is null
              and extract(day from match.day) = extract(day from anchor_date)
            )
            or (
              by_day is not null
              and position(
                ',' || case match.iso_day
                  when 1 then 'MO' when 2 then 'TU' when 3 then 'WE'
                  when 4 then 'TH' when 5 then 'FR' when 6 then 'SA'
                  else 'SU'
                end || ','
                in ',' || by_day || ','
              ) > 0
            )
          )
        )
        or (
          frequency = 'YEARLY'
          and mod(match.year_offset, recurrence_interval) = 0
          and (
            (
              by_day is null
              and extract(month from match.day) = extract(month from anchor_date)
              and extract(day from match.day) = extract(day from anchor_date)
            )
            or (
              by_day is not null
              and position(
                ',' || case match.iso_day
                  when 1 then 'MO' when 2 then 'TU' when 3 then 'WE'
                  when 4 then 'TH' when 5 then 'FR' when 6 then 'SA'
                  else 'SU'
                end || ','
                in ',' || by_day || ','
              ) > 0
            )
          )
        )
      )
      and (match.local_start at time zone time_zone) >= anchor
      and (
        (match.local_start at time zone time_zone) at time zone time_zone
      ) = match.local_start
  ),
  numbered as (
    select
      row_number() over (order by resolved_start) as occurrence_number,
      resolved_start
    from matching_starts
    where recurrence_until is null or resolved_start <= recurrence_until
  )
  select
    numbered.occurrence_number - 1,
    numbered.resolved_start
  from numbered
  where recurrence_count is null
    or numbered.occurrence_number <= recurrence_count;
end;
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
  with event_occurrences as (
    select
      event.*,
      occurrence.occurrence_index,
      occurrence.occurrence_start,
      (
        (
          occurrence.occurrence_start at time zone event.timezone
          + (
            (event.ends_at at time zone event.timezone)
            - (event.starts_at at time zone event.timezone)
          )
        ) at time zone event.timezone
      ) as occurrence_end
    from public.events event
    cross join lateral private.rrule_occurrences(
      event.starts_at,
      event.timezone,
      event.recurrence_rule,
      window_end
    ) occurrence
    where event.user_id = (select auth.uid())
  ),
  task_occurrences as (
    select
      task.*,
      occurrence.occurrence_index,
      occurrence.occurrence_start,
      case
        when task.scheduled_start is not null then
          (
            (
              occurrence.occurrence_start at time zone task.timezone
              + (
                (task.scheduled_end at time zone task.timezone)
                - (task.scheduled_start at time zone task.timezone)
              )
            ) at time zone task.timezone
          )
        else occurrence.occurrence_start
          + make_interval(mins => coalesce(task.estimated_minutes, 30))
      end as occurrence_end
    from public.tasks task
    cross join lateral private.rrule_occurrences(
      coalesce(task.scheduled_start, task.due_at),
      task.timezone,
      task.recurrence_rule,
      window_end
    ) occurrence
    where task.user_id = (select auth.uid())
      and task.status in ('inbox', 'planned')
      and coalesce(task.scheduled_start, task.due_at) is not null
  ),
  bill_occurrences as (
    select
      transaction.id,
      transaction.description,
      transaction.source,
      (
        transaction.due_on::timestamp + time '17:00'
      ) at time zone preference.timezone as occurrence_start,
      (
        transaction.due_on::timestamp + time '17:30'
      ) at time zone preference.timezone as occurrence_end
    from public.transactions transaction
    join public.preferences preference
      on preference.user_id = transaction.user_id
    where transaction.user_id = (select auth.uid())
      and transaction.transaction_type = 'expense'
      and transaction.status = 'planned'
      and transaction.due_on is not null
  ),
  combined as (
    select
      event.id::text || ':' || event.occurrence_index::text as id,
      event.id as source_id,
      event.event_type as kind,
      event.title,
      event.occurrence_start as starts_at,
      event.occurrence_end as ends_at,
      event.all_day,
      event.location,
      event.source,
      event.last_synced_at,
      null::integer as estimated_minutes,
      event.parent_event_id
    from event_occurrences event
    where event.occurrence_start < window_end
      and event.occurrence_end > window_start

    union all

    select
      task.id::text || ':' || task.occurrence_index::text,
      task.id,
      'task'::text,
      task.title,
      task.occurrence_start,
      task.occurrence_end,
      false,
      null::text,
      'local'::text,
      null::timestamptz,
      task.estimated_minutes,
      null::uuid
    from task_occurrences task
    where task.occurrence_start < window_end
      and task.occurrence_end > window_start

    union all

    select
      bill.id::text || ':bill',
      bill.id,
      'bill'::text,
      bill.description,
      bill.occurrence_start,
      bill.occurrence_end,
      false,
      null::text,
      bill.source,
      null::timestamptz,
      null::integer,
      null::uuid
    from bill_occurrences bill
    where bill.occurrence_start >= window_start
      and bill.occurrence_start < window_end
  )
  select combined.*
  from combined
  order by combined.starts_at, combined.title
  limit 1000;
end;
$$;

create or replace function private.resolve_local_timestamp(
  local_value timestamp,
  time_zone text
)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case
    when ((local_value at time zone time_zone) at time zone time_zone) = local_value
      then local_value at time zone time_zone
    else null
  end;
$$;

create or replace function public.transition_task(
  task_id_input uuid,
  action_input text
)
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
  next_due timestamptz;
  next_scheduled_start timestamptz;
  next_scheduled_end timestamptz;
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

  select preference.timezone
  into strict user_timezone
  from public.preferences preference
  where preference.user_id = current_user_id;

  if action_input = 'complete' then
    update public.tasks
    set status = 'completed', completed_at = timezone('utc', now())
    where id = task_id_input and user_id = current_user_id;
  elsif action_input = 'undo' then
    update public.tasks
    set status = 'planned', completed_at = null
    where id = task_id_input and user_id = current_user_id;
  elsif action_input = 'postpone' then
    next_due := case
      when previous.due_at is null then null
      when (
        (
          (
            previous.due_at at time zone user_timezone
            + interval '1 day'
          ) at time zone user_timezone
        ) at time zone user_timezone
      ) = previous.due_at at time zone user_timezone + interval '1 day'
      then (
        previous.due_at at time zone user_timezone + interval '1 day'
      ) at time zone user_timezone
      else null
    end;
    next_scheduled_start := case
      when previous.scheduled_start is null then null
      when (
        (
          (
            previous.scheduled_start at time zone user_timezone
            + interval '1 day'
          ) at time zone user_timezone
        ) at time zone user_timezone
      ) = previous.scheduled_start at time zone user_timezone + interval '1 day'
      then (
        previous.scheduled_start at time zone user_timezone + interval '1 day'
      ) at time zone user_timezone
      else null
    end;
    next_scheduled_end := case
      when previous.scheduled_end is null then null
      when (
        (
          (
            previous.scheduled_end at time zone user_timezone
            + interval '1 day'
          ) at time zone user_timezone
        ) at time zone user_timezone
      ) = previous.scheduled_end at time zone user_timezone + interval '1 day'
      then (
        previous.scheduled_end at time zone user_timezone + interval '1 day'
      ) at time zone user_timezone
      else null
    end;
    if (previous.due_at is not null and next_due is null)
      or (previous.scheduled_start is not null and next_scheduled_start is null)
      or (previous.scheduled_end is not null and next_scheduled_end is null)
    then
      raise exception 'postponed task would use a nonexistent local time'
        using errcode = '22008';
    end if;
    update public.tasks
    set
      due_at = next_due,
      scheduled_start = next_scheduled_start,
      scheduled_end = next_scheduled_end
    where id = task_id_input and user_id = current_user_id;
  else
    tomorrow_start := (
      date_trunc('day', now() at time zone user_timezone)
      + interval '1 day 9 hours'
    ) at time zone user_timezone;
    update public.tasks
    set
      due_at = tomorrow_start,
      scheduled_start = case
        when scheduled_start is null then null
        else tomorrow_start
      end,
      scheduled_end = case
        when scheduled_start is null then null
        else (
          (
            tomorrow_start at time zone user_timezone
            + (
              (scheduled_end at time zone user_timezone)
              - (scheduled_start at time zone user_timezone)
            )
          ) at time zone user_timezone
        )
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
