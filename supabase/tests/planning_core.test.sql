begin;

create extension if not exists pgtap with schema extensions;
select plan(32);

select has_table('public', 'projects', 'projects exist');
select has_table('public', 'tasks', 'tasks exist');
select has_table('public', 'task_links', 'task links exist');
select has_table('public', 'events', 'events exist');
select has_table('public', 'event_links', 'event links and itinerary exist');
select has_table('public', 'planning_areas', 'planning areas exist');
select has_function('public', 'planning_occurrences', array['timestamp with time zone', 'timestamp with time zone'], 'bounded occurrence query exists');
select has_function('public', 'transition_task', array['uuid', 'text'], 'audited task transition exists');

select is(
  (select count(*) from pg_class where oid in (
    'public.projects'::regclass,
    'public.tasks'::regclass,
    'public.task_links'::regclass,
    'public.events'::regclass,
    'public.event_links'::regclass,
    'public.planning_areas'::regclass
  ) and relrowsecurity),
  6::bigint,
  'all planning tables use RLS'
);
select has_index('public', 'tasks', 'tasks_today_idx', 'Today task index exists');
select has_index('public', 'tasks', 'tasks_upcoming_idx', 'Upcoming task index exists');
select has_index('public', 'tasks', 'tasks_project_idx', 'project task index exists');
select has_index('public', 'events', 'events_calendar_idx', 'calendar event index exists');

insert into auth.users (id, email)
values
  ('61000000-0000-0000-0000-000000000001', 'planner-one@example.test'),
  ('62000000-0000-0000-0000-000000000002', 'planner-two@example.test');

insert into public.projects (user_id, name)
values
  ('61000000-0000-0000-0000-000000000001', 'Projeto um'),
  ('62000000-0000-0000-0000-000000000002', 'Projeto dois');

select throws_ok(
  $$
    insert into public.tasks (user_id, title, project_id)
    select
      '61000000-0000-0000-0000-000000000001',
      'Cross-user',
      id
    from public.projects
    where user_id = '62000000-0000-0000-0000-000000000002'
  $$,
  '23503',
  null,
  'task cannot reference another user project'
);

insert into public.tasks (id, user_id, title, due_at, recurrence_rule)
values (
  '61100000-0000-0000-0000-000000000001',
  '61000000-0000-0000-0000-000000000001',
  'Rotina',
  '2026-07-24 09:00:00-03',
  'FREQ=DAILY;COUNT=3'
);

select throws_ok(
  $$
    insert into public.tasks (
      user_id, title, parent_task_id
    ) values (
      '62000000-0000-0000-0000-000000000002',
      'Subtarefa cruzada',
      '61100000-0000-0000-0000-000000000001'
    )
  $$,
  '23503',
  null,
  'subtask cannot reference another user'
);

select throws_ok(
  $$
    insert into public.events (
      user_id, title, starts_at, ends_at
    ) values (
      '61000000-0000-0000-0000-000000000001',
      'Inválido',
      '2026-07-24 10:00:00-03',
      '2026-07-24 09:00:00-03'
    )
  $$,
  '23514',
  null,
  'event end must be after start'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$
    insert into public.events (
      user_id, event_type, title, starts_at, ends_at, recurrence_rule
    ) values (
      '61000000-0000-0000-0000-000000000001',
      'event',
      'Agenda',
      '2026-07-24 10:00:00-03',
      '2026-07-24 11:00:00-03',
      'FREQ=WEEKLY;COUNT=2'
    )
  $$,
  'user can create a local event'
);
select is((select count(*) from public.projects), 1::bigint, 'RLS hides another user project');
select is((select count(*) from public.tasks), 1::bigint, 'RLS hides another user tasks');
select is((select count(*) from public.events), 1::bigint, 'RLS exposes own events');

select is(
  (
    select count(*)
    from public.planning_occurrences(
      '2026-07-24 00:00:00-03',
      '2026-07-31 00:00:00-03'
    )
    where kind = 'task'
  ),
  3::bigint,
  'RRULE task occurrences are bounded by COUNT and query window'
);
select throws_ok(
  $$
    select *
    from public.planning_occurrences(
      '2026-01-01 00:00:00-03',
      '2028-01-01 00:00:00-03'
    )
  $$,
  '22023',
  'occurrence window must be between 1 second and 366 days',
  'occurrence query rejects unbounded windows'
);

select lives_ok(
  $$ select public.transition_task('61100000-0000-0000-0000-000000000001', 'complete') $$,
  'task can be completed atomically'
);
select is((select status from public.tasks where id = '61100000-0000-0000-0000-000000000001'), 'completed', 'complete changes status');
select is((select count(*) from public.audit_events where action = 'task.complete'), 1::bigint, 'completion is audited');
select lives_ok(
  $$ select public.transition_task('61100000-0000-0000-0000-000000000001', 'undo') $$,
  'completion can be undone'
);
select is((select status from public.tasks where id = '61100000-0000-0000-0000-000000000001'), 'planned', 'undo restores planned state');
select lives_ok(
  $$ select public.transition_task('61100000-0000-0000-0000-000000000001', 'tomorrow') $$,
  'task can move to tomorrow'
);
select ok((select due_at > now() from public.tasks where id = '61100000-0000-0000-0000-000000000001'), 'tomorrow updates due date');
select is((select count(*) from public.audit_events where action like 'task.%'), 3::bigint, 'every transition is audited');

select set_config('request.jwt.claim.sub', '62000000-0000-0000-0000-000000000002', true);
select is((select count(*) from public.tasks), 0::bigint, 'another user cannot read tasks');
select is_empty(
  $$ update public.tasks set title = 'Changed' returning 1 $$,
  'another user cannot update tasks'
);

select * from finish();
rollback;
