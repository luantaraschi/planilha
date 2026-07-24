begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

select has_table('public', 'habits', 'habits exist');
select has_table('public', 'habit_logs', 'habit logs exist');
select has_index('public', 'habits', 'habits_today_idx', 'Today habits index exists');
select has_index('public', 'habit_logs', 'habit_logs_user_date_idx', 'daily habit logs index exists');

insert into auth.users (id, email)
values
  ('71000000-0000-0000-0000-000000000001', 'review-one@example.test'),
  ('72000000-0000-0000-0000-000000000002', 'review-two@example.test');

update public.preferences
set timezone = 'America/New_York'
where user_id = '71000000-0000-0000-0000-000000000001';

insert into public.projects (id, user_id, name)
values
  (
    '71100000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000001',
    'Projeto um'
  ),
  (
    '72100000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000002',
    'Projeto dois'
  );

select throws_ok(
  $$
    insert into public.events (
      user_id, title, starts_at, ends_at, recurrence_rule
    ) values (
      '71000000-0000-0000-0000-000000000001',
      'Regra não suportada',
      '2026-07-24 12:00:00+00',
      '2026-07-24 13:00:00+00',
      'FREQ=MONTHLY;BYMONTHDAY=24'
    )
  $$,
  '23514',
  null,
  'events reject unsupported RRULE components'
);

select throws_ok(
  $$
    insert into public.tasks (
      user_id, title, due_at, recurrence_rule
    ) values (
      '71000000-0000-0000-0000-000000000001',
      'Regra não suportada',
      '2026-07-24 12:00:00+00',
      'FREQ=DAILY;BYHOUR=9'
    )
  $$,
  '23514',
  null,
  'tasks reject unsupported RRULE components'
);

insert into public.tasks (
  id, user_id, title, due_at, timezone, recurrence_rule
) values
  (
    '71200000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000001',
    'Tarefa do usuário um',
    '2026-07-24 12:00:00+00',
    'America/New_York',
    null
  ),
  (
    '72200000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000002',
    'Tarefa do usuário dois',
    '2026-07-24 12:00:00+00',
    'UTC',
    null
  );

insert into public.events (
  id, user_id, title, starts_at, ends_at, timezone
) values
  (
    '71300000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000001',
    'Evento comum',
    '2026-07-24 12:00:00+00',
    '2026-07-24 13:00:00+00',
    'America/New_York'
  ),
  (
    '72300000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000002',
    'Evento de outro usuário',
    '2026-07-24 12:00:00+00',
    '2026-07-24 13:00:00+00',
    'UTC'
  );

select throws_ok(
  $$
    insert into public.task_links (user_id, task_id, link_type, linked_id)
    values (
      '71000000-0000-0000-0000-000000000001',
      '71200000-0000-0000-0000-000000000001',
      'project',
      '72100000-0000-0000-0000-000000000001'
    )
  $$,
  '23503',
  null,
  'task links cannot target another user project'
);

select throws_ok(
  $$
    insert into public.event_links (user_id, event_id, link_type, linked_id)
    values (
      '71000000-0000-0000-0000-000000000001',
      '71300000-0000-0000-0000-000000000001',
      'task',
      '72200000-0000-0000-0000-000000000001'
    )
  $$,
  '23503',
  null,
  'event links cannot target another user task'
);

select throws_ok(
  $$
    insert into public.task_links (user_id, task_id, link_type, linked_id)
    values (
      '71000000-0000-0000-0000-000000000001',
      '71200000-0000-0000-0000-000000000001',
      'event',
      '71999999-0000-0000-0000-000000000999'
    )
  $$,
  '23503',
  null,
  'planning links reject nonexistent targets'
);

select throws_ok(
  $$
    insert into public.task_links (user_id, task_id, link_type, linked_id)
    values (
      '71000000-0000-0000-0000-000000000001',
      '71200000-0000-0000-0000-000000000001',
      'goal',
      '71100000-0000-0000-0000-000000000001'
    )
  $$,
  '23514',
  null,
  'task links reject unsupported target types'
);

select throws_ok(
  $$
    insert into public.events (
      user_id, event_type, title, starts_at, ends_at, timezone,
      trip_starts_on, trip_ends_on
    ) values (
      '71000000-0000-0000-0000-000000000001',
      'trip',
      'Viagem sem fim',
      '2026-08-01 12:00:00+00',
      '2026-08-02 12:00:00+00',
      'America/New_York',
      '2026-08-01',
      null
    )
  $$,
  '23514',
  null,
  'trips require both dates'
);

select throws_ok(
  $$
    insert into public.events (
      user_id, parent_event_id, title, starts_at, ends_at, timezone
    ) values (
      '71000000-0000-0000-0000-000000000001',
      '71300000-0000-0000-0000-000000000001',
      'Filho de evento comum',
      '2026-07-24 14:00:00+00',
      '2026-07-24 15:00:00+00',
      'America/New_York'
    )
  $$,
  '23514',
  null,
  'itinerary children require a same-user trip parent'
);

insert into public.habits (
  id, user_id, title, scheduled_time
) values (
  '71400000-0000-0000-0000-000000000001',
  '71000000-0000-0000-0000-000000000001',
  'Alongar',
  '07:30'
);

select throws_ok(
  $$
    insert into public.habit_logs (
      user_id, habit_id, occurred_on, status
    ) values (
      '72000000-0000-0000-0000-000000000002',
      '71400000-0000-0000-0000-000000000001',
      '2026-07-24',
      'completed'
    )
  $$,
  '23503',
  null,
  'habit logs cannot reference another user habit'
);

insert into public.events (
  id, user_id, title, starts_at, ends_at, timezone, recurrence_rule
) values
  (
    '71500000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000001',
    'Segunda e quarta',
    '2026-07-20 12:00:00+00',
    '2026-07-20 13:00:00+00',
    'America/Bahia',
    'FREQ=WEEKLY;COUNT=4;BYDAY=MO,WE'
  ),
  (
    '71500000-0000-0000-0000-000000000002',
    '71000000-0000-0000-0000-000000000001',
    'Até quarta',
    '2026-07-20 12:00:00+00',
    '2026-07-20 13:00:00+00',
    'America/Bahia',
    'FREQ=DAILY;UNTIL=20260722T120000Z'
  ),
  (
    '71500000-0000-0000-0000-000000000003',
    '71000000-0000-0000-0000-000000000001',
    'Série antiga',
    '2020-01-01 14:00:00+00',
    '2020-01-01 15:00:00+00',
    'America/New_York',
    'FREQ=DAILY'
  ),
  (
    '71500000-0000-0000-0000-000000000004',
    '71000000-0000-0000-0000-000000000001',
    'Nove horas em Nova York',
    '2026-03-07 14:00:00+00',
    '2026-03-07 15:00:00+00',
    'America/New_York',
    'FREQ=DAILY;COUNT=3'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '71000000-0000-0000-0000-000000000001',
  true
);

select is(
  (
    select array_agg(
      (occurrence.starts_at at time zone 'America/Bahia')::date
      order by occurrence.starts_at
    )::text
    from public.planning_occurrences(
      '2026-07-19 00:00:00+00',
      '2026-08-01 00:00:00+00'
    ) occurrence
    where occurrence.source_id = '71500000-0000-0000-0000-000000000001'
  ),
  '{2026-07-20,2026-07-22,2026-07-27,2026-07-29}',
  'weekly BYDAY and COUNT are expanded from DTSTART'
);

select is(
  (
    select count(*)
    from public.planning_occurrences(
      '2026-07-19 00:00:00+00',
      '2026-08-01 00:00:00+00'
    )
    where source_id = '71500000-0000-0000-0000-000000000002'
  ),
  3::bigint,
  'UNTIL is inclusive and bounds the recurrence'
);

select is(
  (
    select count(*)
    from public.planning_occurrences(
      '2026-07-20 00:00:00+00',
      '2026-07-22 00:00:00+00'
    )
    where source_id = '71500000-0000-0000-0000-000000000003'
  ),
  2::bigint,
  'distant unbounded recurrences are not cut off by an old index cap'
);

select is(
  (
    select array_agg(
      to_char(occurrence.starts_at at time zone 'America/New_York', 'HH24:MI')
      order by occurrence.starts_at
    )::text
    from public.planning_occurrences(
      '2026-03-07 00:00:00+00',
      '2026-03-11 00:00:00+00'
    ) occurrence
    where occurrence.source_id = '71500000-0000-0000-0000-000000000004'
  ),
  '{09:00,09:00,09:00}',
  'recurrence preserves wall time across DST'
);

select throws_ok(
  $$
    select *
    from public.planning_occurrences(
      '2026-01-01 00:00:00+00',
      '2027-01-03 00:00:00+00'
    )
  $$,
  '22023',
  'occurrence window must be between 1 second and 366 days',
  'occurrence query rejects windows longer than 366 days'
);

select ok(
  (
    select count(*)
    from public.planning_occurrences(
      '2026-01-01 00:00:00+00',
      '2027-01-01 00:00:00+00'
    )
  ) <= 1000,
  'occurrence query returns at most 1000 rows'
);

insert into public.financial_accounts (
  id, user_id, name, account_type
) values (
  '71600000-0000-0000-0000-000000000001',
  '71000000-0000-0000-0000-000000000001',
  'Conta',
  'checking'
);

insert into public.transactions (
  id, user_id, account_id, transaction_type, amount_cents,
  occurred_on, due_on, status, description
) values (
  '71700000-0000-0000-0000-000000000001',
  '71000000-0000-0000-0000-000000000001',
  '71600000-0000-0000-0000-000000000001',
  'expense',
  1000,
  '2026-07-24',
  '2026-07-24',
  'planned',
  'Conta de teste'
);

select is(
  (
    select to_char(starts_at at time zone 'America/New_York', 'HH24:MI')
    from public.planning_occurrences(
      '2026-07-24 00:00:00+00',
      '2026-07-25 00:00:00+00'
    )
    where source_id = '71700000-0000-0000-0000-000000000001'
  ),
  '17:00',
  'planned bills use the verified profile timezone'
);

update public.tasks
set
  due_at = '2026-03-07 14:00:00+00',
  scheduled_start = '2026-03-07 14:00:00+00',
  scheduled_end = '2026-03-07 15:00:00+00',
  timezone = 'America/New_York'
where id = '71200000-0000-0000-0000-000000000001';

select lives_ok(
  $$
    select public.transition_task(
      '71200000-0000-0000-0000-000000000001',
      'postpone'
    )
  $$,
  'postpone transition succeeds across DST'
);

select is(
  (
    select to_char(due_at at time zone timezone, 'YYYY-MM-DD HH24:MI')
    from public.tasks
    where id = '71200000-0000-0000-0000-000000000001'
  ),
  '2026-03-08 09:00',
  'postpone preserves task wall time across DST'
);

select is(
  (
    select count(*)
    from pg_class
    where oid in ('public.habits'::regclass, 'public.habit_logs'::regclass)
      and relrowsecurity
  ),
  2::bigint,
  'habit tables use RLS'
);

select * from finish();
rollback;
