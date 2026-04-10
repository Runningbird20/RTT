-- Align the live Supabase schema with the current Expo workout logging flow.
--
-- This script keeps the app-compatible training model:
-- - public.users
-- - public.workouts
-- - public.exercise_entries
-- - public.bodyweight_entries
-- - public.performance_entries
--
-- Current app assumptions:
-- - workout logging saves exercise, sets, reps, weight, and notes
-- - bodyweight logging uses a simple date + weight input
-- - the bodyweight UI shows dates in US format, but stores them as ISO dates
-- - performance logging can save standalone metric type + value + unit rows
-- - bodyweight history/progress reads bodyweight_entries.entry_date
--
-- It is safe to run multiple times.
--
-- If you previously imported users with placeholder UUIDs and this script still
-- leaves some rows unmapped, run supabase/sql/remap_imported_users_to_auth.sql
-- afterward and then rerun this file.

begin;

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'workout_intensity'
  ) then
    create type public.workout_intensity as enum ('Easy', 'Moderate', 'Hard');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.normalize_bodyweight_entry_dates()
returns trigger
language plpgsql
as $$
begin
  if new.entry_date is null and new.measured_at is not null then
    new.entry_date = timezone('utc', new.measured_at)::date;
  end if;

  if new.entry_date is null then
    new.entry_date = current_date;
  end if;

  if new.measured_at is null then
    new.measured_at = (new.entry_date::timestamp + interval '12 hours') at time zone 'utc';
  end if;

  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.users
  add column if not exists email text,
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

create index if not exists users_email_idx
  on public.users (lower(email));

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  title text not null default 'Workout',
  notes text,
  performed_at timestamptz not null default timezone('utc', now()),
  workout_date date not null default current_date,
  duration_minutes integer,
  intensity public.workout_intensity not null default 'Moderate',
  location text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.workouts
  add column if not exists user_id uuid,
  add column if not exists title text,
  add column if not exists notes text,
  add column if not exists performed_at timestamptz,
  add column if not exists workout_date date,
  add column if not exists duration_minutes integer,
  add column if not exists intensity public.workout_intensity,
  add column if not exists location text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

alter table public.workouts
  alter column id set default gen_random_uuid(),
  alter column performed_at set default timezone('utc', now()),
  alter column workout_date set default current_date,
  alter column intensity set default 'Moderate',
  alter column created_at set default timezone('utc', now()),
  alter column updated_at set default timezone('utc', now());

create table if not exists public.exercise_entries (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.workouts (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  exercise_name text not null,
  sets integer,
  reps integer,
  load numeric(8,2),
  weight_unit text not null default 'lb',
  order_index integer not null default 0,
  performed_at timestamptz not null default timezone('utc', now()),
  rest_seconds integer,
  rpe numeric(3,1),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.exercise_entries
  add column if not exists workout_id uuid,
  add column if not exists user_id uuid,
  add column if not exists exercise_name text,
  add column if not exists sets integer,
  add column if not exists reps integer,
  add column if not exists load numeric(8,2),
  add column if not exists weight_unit text default 'lb',
  add column if not exists order_index integer default 0,
  add column if not exists performed_at timestamptz default timezone('utc', now()),
  add column if not exists rest_seconds integer,
  add column if not exists rpe numeric(3,1),
  add column if not exists notes text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

alter table public.exercise_entries
  alter column id set default gen_random_uuid(),
  alter column weight_unit set default 'lb',
  alter column order_index set default 0,
  alter column performed_at set default timezone('utc', now()),
  alter column created_at set default timezone('utc', now()),
  alter column updated_at set default timezone('utc', now());

create table if not exists public.bodyweight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete set null,
  weight numeric(6,2) not null,
  unit text not null default 'lb',
  entry_date date not null default current_date,
  measured_at timestamptz not null default timezone('utc', now()),
  body_fat_percentage numeric(5,2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.bodyweight_entries is
'Simple bodyweight log entries keyed by entry_date and weight.';

comment on column public.bodyweight_entries.entry_date is
'Calendar day selected in the UI, stored as an ISO date regardless of locale formatting.';

comment on column public.bodyweight_entries.measured_at is
'Normalized timestamp used for ordering/compatibility when only a date is captured.';

alter table public.bodyweight_entries
  add column if not exists user_id uuid,
  add column if not exists workout_id uuid,
  add column if not exists weight numeric(6,2),
  add column if not exists unit text default 'lb',
  add column if not exists entry_date date,
  add column if not exists measured_at timestamptz default timezone('utc', now()),
  add column if not exists body_fat_percentage numeric(5,2),
  add column if not exists notes text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

alter table public.bodyweight_entries
  alter column id set default gen_random_uuid(),
  alter column unit set default 'lb',
  alter column entry_date set default current_date,
  alter column measured_at set default timezone('utc', now()),
  alter column created_at set default timezone('utc', now()),
  alter column updated_at set default timezone('utc', now());

create table if not exists public.performance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete set null,
  exercise_entry_id uuid references public.exercise_entries (id) on delete set null,
  exercise_name text,
  metric_name text not null,
  value numeric(10,2) not null,
  unit text,
  entry_date date not null default current_date,
  reps integer,
  weight numeric(8,2),
  duration_seconds integer,
  distance numeric(10,2),
  recorded_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.performance_entries is
'Performance metrics, including standalone metric logs and workout-linked entries.';

alter table public.performance_entries
  add column if not exists user_id uuid,
  add column if not exists value numeric(10,2),
  add column if not exists unit text,
  add column if not exists recorded_at timestamptz default timezone('utc', now()),
  add column if not exists workout_id uuid,
  add column if not exists exercise_entry_id uuid,
  add column if not exists exercise_name text,
  add column if not exists metric_name text,
  add column if not exists entry_date date,
  add column if not exists reps integer,
  add column if not exists weight numeric(8,2),
  add column if not exists duration_seconds integer,
  add column if not exists distance numeric(10,2),
  add column if not exists notes text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

alter table public.performance_entries
  alter column id set default gen_random_uuid(),
  alter column entry_date set default current_date,
  alter column recorded_at set default timezone('utc', now()),
  alter column created_at set default timezone('utc', now()),
  alter column updated_at set default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workouts'
      and column_name = 'intensity'
      and udt_name <> 'workout_intensity'
  ) then
    alter table public.workouts
      alter column intensity type public.workout_intensity
      using case
        when intensity::text in ('Easy', 'Moderate', 'Hard') then intensity::text::public.workout_intensity
        else 'Moderate'::public.workout_intensity
      end;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workouts'
      and column_name = 'session_type'
  ) then
    execute $sql$
      update public.workouts
      set title = coalesce(nullif(title, ''), nullif(session_type, ''), 'Workout')
      where title is null or btrim(title) = ''
    $sql$;
  else
    update public.workouts
    set title = 'Workout'
    where title is null or btrim(title) = '';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workouts'
      and column_name = 'date'
  ) then
    execute $sql$
      update public.workouts
      set workout_date = coalesce(workout_date, date, performed_at::date, created_at::date, current_date)
      where workout_date is null
    $sql$;
  else
    update public.workouts
    set workout_date = coalesce(workout_date, performed_at::date, created_at::date, current_date)
    where workout_date is null;
  end if;
end
$$;

update public.workouts
set performed_at = coalesce(performed_at, created_at, timezone('utc', now()))
where performed_at is null;

update public.workouts
set intensity = coalesce(intensity, 'Moderate'::public.workout_intensity)
where intensity is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercise_entries'
      and column_name = 'weight'
  ) then
    execute $sql$
      update public.exercise_entries
      set load = coalesce(load, weight)
      where load is null and weight is not null
    $sql$;
  end if;
end
$$;

update public.exercise_entries
set exercise_name = coalesce(nullif(exercise_name, ''), 'Exercise')
where exercise_name is null or btrim(exercise_name) = '';

update public.exercise_entries
set weight_unit = coalesce(nullif(weight_unit, ''), 'lb')
where weight_unit is null or btrim(weight_unit) = '';

update public.exercise_entries
set order_index = coalesce(order_index, 0)
where order_index is null;

update public.exercise_entries
set performed_at = coalesce(performed_at, created_at, timezone('utc', now()))
where performed_at is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bodyweight_entries'
      and column_name = 'weight_unit'
  ) then
    execute $sql$
      update public.bodyweight_entries
      set unit = coalesce(unit, weight_unit, 'lb')
      where unit is null or btrim(unit) = ''
    $sql$;
  else
    update public.bodyweight_entries
    set unit = coalesce(unit, 'lb')
    where unit is null or btrim(unit) = '';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bodyweight_entries'
      and column_name = 'date'
  ) then
    execute $sql$
      update public.bodyweight_entries
      set entry_date = coalesce(entry_date, date, measured_at::date, created_at::date, current_date)
      where entry_date is null
    $sql$;
  else
    update public.bodyweight_entries
    set entry_date = coalesce(entry_date, measured_at::date, created_at::date, current_date)
    where entry_date is null;
  end if;
end
$$;

update public.bodyweight_entries
set measured_at = coalesce(measured_at, created_at, timezone('utc', now()))
where measured_at is null;

update public.bodyweight_entries
set measured_at = (entry_date::timestamp + interval '12 hours') at time zone 'utc'
where entry_date is not null
  and (
    measured_at is null
    or timezone('utc', measured_at)::date <> entry_date
  );

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'performance_entries'
      and column_name = 'metric_type'
  ) then
    execute $sql$
      update public.performance_entries
      set metric_name = coalesce(metric_name, metric_type, 'working_set_load')
      where metric_name is null or btrim(metric_name) = ''
    $sql$;
  else
    update public.performance_entries
    set metric_name = coalesce(metric_name, 'working_set_load')
    where metric_name is null or btrim(metric_name) = '';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'performance_entries'
      and column_name = 'date'
  ) then
    execute $sql$
      update public.performance_entries
      set entry_date = coalesce(entry_date, date, recorded_at::date, created_at::date, current_date)
      where entry_date is null
    $sql$;
  else
    update public.performance_entries
    set entry_date = coalesce(entry_date, recorded_at::date, created_at::date, current_date)
    where entry_date is null;
  end if;
end
$$;

update public.performance_entries
set recorded_at = coalesce(recorded_at, created_at, timezone('utc', now()))
where recorded_at is null;

drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.users.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.users (id, email, display_name, avatar_url)
select
  au.id,
  lower(au.email),
  coalesce(
    nullif(au.raw_user_meta_data ->> 'display_name', ''),
    nullif(au.raw_user_meta_data ->> 'full_name', ''),
    split_part(au.email, '@', 1)
  ),
  nullif(au.raw_user_meta_data ->> 'avatar_url', '')
from auth.users au
where au.id is not null
  and not exists (
    select 1
    from public.users u
    where u.id = au.id
  );

alter table public.workouts drop constraint if exists workouts_user_id_fkey;
alter table public.exercise_entries drop constraint if exists exercise_entries_user_id_fkey;
alter table public.bodyweight_entries drop constraint if exists bodyweight_entries_user_id_fkey;
alter table public.performance_entries drop constraint if exists performance_entries_user_id_fkey;

create temporary table user_id_map on commit drop as
select
  pu.id as old_user_id,
  au.id as new_user_id,
  lower(pu.email) as email
from public.users pu
join auth.users au
  on lower(au.email) = lower(pu.email)
where pu.id <> au.id
  and not exists (
    select 1
    from public.users already_mapped
    where already_mapped.id = au.id
  );

update public.users u
set id = m.new_user_id
from user_id_map m
where u.id = m.old_user_id;

update public.workouts w
set user_id = m.new_user_id
from user_id_map m
where w.user_id = m.old_user_id;

update public.exercise_entries e
set user_id = m.new_user_id
from user_id_map m
where e.user_id = m.old_user_id;

update public.bodyweight_entries b
set user_id = m.new_user_id
from user_id_map m
where b.user_id = m.old_user_id;

update public.performance_entries p
set user_id = m.new_user_id
from user_id_map m
where p.user_id = m.old_user_id;

alter table public.workouts drop constraint if exists workouts_duration_minutes_check;
alter table public.exercise_entries drop constraint if exists exercise_entries_sets_check;
alter table public.exercise_entries drop constraint if exists exercise_entries_reps_check;
alter table public.exercise_entries drop constraint if exists exercise_entries_load_check;
alter table public.exercise_entries drop constraint if exists exercise_entries_order_index_check;
alter table public.exercise_entries drop constraint if exists exercise_entries_weight_unit_check;
alter table public.exercise_entries drop constraint if exists exercise_entries_rest_seconds_check;
alter table public.exercise_entries drop constraint if exists exercise_entries_rpe_check;
alter table public.bodyweight_entries drop constraint if exists bodyweight_entries_weight_check;
alter table public.bodyweight_entries drop constraint if exists bodyweight_entries_unit_check;
alter table public.bodyweight_entries drop constraint if exists bodyweight_entries_body_fat_percentage_check;
alter table public.performance_entries drop constraint if exists performance_entries_value_check;
alter table public.performance_entries drop constraint if exists performance_entries_reps_check;
alter table public.performance_entries drop constraint if exists performance_entries_weight_check;
alter table public.performance_entries drop constraint if exists performance_entries_duration_seconds_check;
alter table public.performance_entries drop constraint if exists performance_entries_distance_check;

alter table public.workouts
  add constraint workouts_duration_minutes_check
  check (duration_minutes is null or duration_minutes >= 0) not valid;

alter table public.exercise_entries
  add constraint exercise_entries_sets_check
  check (sets is null or sets >= 0) not valid,
  add constraint exercise_entries_reps_check
  check (reps is null or reps >= 0) not valid,
  add constraint exercise_entries_load_check
  check (load is null or load >= 0) not valid,
  add constraint exercise_entries_order_index_check
  check (order_index is null or order_index >= 0) not valid,
  add constraint exercise_entries_weight_unit_check
  check (weight_unit in ('lb', 'kg')) not valid,
  add constraint exercise_entries_rest_seconds_check
  check (rest_seconds is null or rest_seconds >= 0) not valid,
  add constraint exercise_entries_rpe_check
  check (rpe is null or (rpe >= 0 and rpe <= 10)) not valid;

alter table public.bodyweight_entries
  add constraint bodyweight_entries_weight_check
  check (weight > 0) not valid,
  add constraint bodyweight_entries_unit_check
  check (unit in ('lb', 'kg')) not valid,
  add constraint bodyweight_entries_body_fat_percentage_check
  check (body_fat_percentage is null or (body_fat_percentage >= 0 and body_fat_percentage <= 100)) not valid;

alter table public.performance_entries
  add constraint performance_entries_value_check
  check (value >= 0) not valid,
  add constraint performance_entries_reps_check
  check (reps is null or reps >= 0) not valid,
  add constraint performance_entries_weight_check
  check (weight is null or weight >= 0) not valid,
  add constraint performance_entries_duration_seconds_check
  check (duration_seconds is null or duration_seconds >= 0) not valid,
  add constraint performance_entries_distance_check
  check (distance is null or distance >= 0) not valid;

alter table public.exercise_entries drop constraint if exists exercise_entries_workout_id_fkey;
alter table public.bodyweight_entries drop constraint if exists bodyweight_entries_workout_id_fkey;
alter table public.performance_entries drop constraint if exists performance_entries_workout_id_fkey;
alter table public.performance_entries drop constraint if exists performance_entries_exercise_entry_id_fkey;

alter table public.workouts
  add constraint workouts_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade not valid;

alter table public.exercise_entries
  add constraint exercise_entries_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade not valid,
  add constraint exercise_entries_workout_id_fkey
  foreign key (workout_id) references public.workouts(id) on delete cascade not valid;

alter table public.bodyweight_entries
  add constraint bodyweight_entries_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade not valid,
  add constraint bodyweight_entries_workout_id_fkey
  foreign key (workout_id) references public.workouts(id) on delete set null not valid;

alter table public.performance_entries
  add constraint performance_entries_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade not valid,
  add constraint performance_entries_workout_id_fkey
  foreign key (workout_id) references public.workouts(id) on delete set null not valid,
  add constraint performance_entries_exercise_entry_id_fkey
  foreign key (exercise_entry_id) references public.exercise_entries(id) on delete set null not valid;

create index if not exists workouts_user_id_workout_date_idx
  on public.workouts (user_id, workout_date desc);

create index if not exists workouts_user_id_performed_at_idx
  on public.workouts (user_id, performed_at desc);

create index if not exists exercise_entries_workout_id_order_index_idx
  on public.exercise_entries (workout_id, order_index);

create index if not exists exercise_entries_user_id_performed_at_idx
  on public.exercise_entries (user_id, performed_at desc);

create index if not exists bodyweight_entries_user_id_measured_at_idx
  on public.bodyweight_entries (user_id, measured_at desc);

create index if not exists bodyweight_entries_user_id_entry_date_idx
  on public.bodyweight_entries (user_id, entry_date desc);

create index if not exists bodyweight_entries_workout_id_idx
  on public.bodyweight_entries (workout_id);

create index if not exists performance_entries_user_id_recorded_at_idx
  on public.performance_entries (user_id, recorded_at desc);

create index if not exists performance_entries_exercise_entry_id_idx
  on public.performance_entries (exercise_entry_id);

create or replace function public.ensure_workout_belongs_to_user()
returns trigger
language plpgsql
as $$
begin
  if new.workout_id is null or new.user_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.workouts
    where id = new.workout_id
      and user_id = new.user_id
  ) then
    raise exception 'Workout % does not belong to user %', new.workout_id, new.user_id;
  end if;

  return new;
end;
$$;

create or replace function public.ensure_exercise_entry_belongs_to_user()
returns trigger
language plpgsql
as $$
declare
  linked_workout_id uuid;
begin
  if new.exercise_entry_id is null or new.user_id is null then
    return new;
  end if;

  select workout_id
  into linked_workout_id
  from public.exercise_entries
  where id = new.exercise_entry_id
    and user_id = new.user_id;

  if linked_workout_id is null then
    raise exception 'Exercise entry % does not belong to user %', new.exercise_entry_id, new.user_id;
  end if;

  if new.workout_id is not null and linked_workout_id <> new.workout_id then
    raise exception 'Exercise entry % does not belong to workout %', new.exercise_entry_id, new.workout_id;
  end if;

  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
before update on public.workouts
for each row
execute function public.set_updated_at();

drop trigger if exists exercise_entries_set_updated_at on public.exercise_entries;
create trigger exercise_entries_set_updated_at
before update on public.exercise_entries
for each row
execute function public.set_updated_at();

drop trigger if exists bodyweight_entries_set_updated_at on public.bodyweight_entries;
create trigger bodyweight_entries_set_updated_at
before update on public.bodyweight_entries
for each row
execute function public.set_updated_at();

drop trigger if exists bodyweight_entries_normalize_dates on public.bodyweight_entries;
create trigger bodyweight_entries_normalize_dates
before insert or update on public.bodyweight_entries
for each row
execute function public.normalize_bodyweight_entry_dates();

drop trigger if exists performance_entries_set_updated_at on public.performance_entries;
create trigger performance_entries_set_updated_at
before update on public.performance_entries
for each row
execute function public.set_updated_at();

drop trigger if exists exercise_entries_verify_workout_owner on public.exercise_entries;
create trigger exercise_entries_verify_workout_owner
before insert or update on public.exercise_entries
for each row
execute function public.ensure_workout_belongs_to_user();

drop trigger if exists bodyweight_entries_verify_workout_owner on public.bodyweight_entries;
create trigger bodyweight_entries_verify_workout_owner
before insert or update on public.bodyweight_entries
for each row
execute function public.ensure_workout_belongs_to_user();

drop trigger if exists performance_entries_verify_workout_owner on public.performance_entries;
create trigger performance_entries_verify_workout_owner
before insert or update on public.performance_entries
for each row
execute function public.ensure_workout_belongs_to_user();

drop trigger if exists performance_entries_verify_exercise_owner on public.performance_entries;
create trigger performance_entries_verify_exercise_owner
before insert or update on public.performance_entries
for each row
execute function public.ensure_exercise_entry_belongs_to_user();

grant select, insert, update, delete on table public.users to authenticated, service_role;
grant select, insert, update, delete on table public.workouts to authenticated, service_role;
grant select, insert, update, delete on table public.exercise_entries to authenticated, service_role;
grant select, insert, update, delete on table public.bodyweight_entries to authenticated, service_role;
grant select, insert, update, delete on table public.performance_entries to authenticated, service_role;

alter table public.users enable row level security;
alter table public.workouts enable row level security;
alter table public.exercise_entries enable row level security;
alter table public.bodyweight_entries enable row level security;
alter table public.performance_entries enable row level security;

drop policy if exists "Allow all workouts" on public.workouts;
drop policy if exists "Allow all exercise_entries" on public.exercise_entries;
drop policy if exists "Allow all bodyweight_entries" on public.bodyweight_entries;
drop policy if exists "Allow all performance_entries" on public.performance_entries;

drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can delete their own profile" on public.users;
create policy "Users can delete their own profile"
on public.users
for delete
using (auth.uid() = id);

drop policy if exists "Users can manage their own workouts" on public.workouts;
create policy "Users can manage their own workouts"
on public.workouts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own exercise entries" on public.exercise_entries;
create policy "Users can manage their own exercise entries"
on public.exercise_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own bodyweight entries" on public.bodyweight_entries;
create policy "Users can manage their own bodyweight entries"
on public.bodyweight_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own performance entries" on public.performance_entries;
create policy "Users can manage their own performance entries"
on public.performance_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
