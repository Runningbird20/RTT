-- CSV-compatible training schema
-- Run this in the Supabase SQL Editor on a dev database or after a backup.
-- It drops and recreates the training tables so the CSV files in
-- supabase/test-data/ import cleanly.
--
-- Recommended import order after running this file:
-- 1. users.csv
-- 2. workouts.csv
-- 3. exercise_entries.csv
-- 4. bodyweight_entries.csv
-- 5. performance_entries.csv
--
-- Note:
-- This script intentionally leaves any existing auth.users triggers/functions alone.
-- It only resets the CSV import tables in public.

begin;

create extension if not exists pgcrypto;

drop table if exists public.performance_entries cascade;
drop table if exists public.bodyweight_entries cascade;
drop table if exists public.exercise_entries cascade;
drop table if exists public.workouts cascade;
drop table if exists public.users cascade;
drop type if exists public.workout_intensity;

create type public.workout_intensity as enum ('Easy', 'Moderate', 'Hard');

create table public.users (
  id uuid primary key,
  email text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  notes text,
  performed_at timestamptz not null,
  workout_date date not null,
  duration_minutes integer,
  intensity public.workout_intensity not null default 'Moderate',
  location text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workouts_duration_minutes_check
    check (duration_minutes is null or duration_minutes >= 0)
);

create table public.exercise_entries (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  exercise_name text not null,
  sets integer,
  reps integer,
  load numeric(8,2),
  weight_unit text not null default 'lb',
  order_index integer not null default 0,
  rest_seconds integer,
  rpe numeric(3,1),
  performed_at timestamptz not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint exercise_entries_sets_check
    check (sets is null or sets >= 0),
  constraint exercise_entries_reps_check
    check (reps is null or reps >= 0),
  constraint exercise_entries_load_check
    check (load is null or load >= 0),
  constraint exercise_entries_order_index_check
    check (order_index >= 0),
  constraint exercise_entries_rest_seconds_check
    check (rest_seconds is null or rest_seconds >= 0),
  constraint exercise_entries_rpe_check
    check (rpe is null or (rpe >= 0 and rpe <= 10)),
  constraint exercise_entries_weight_unit_check
    check (weight_unit in ('lb', 'kg'))
);

create table public.bodyweight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete set null,
  weight numeric(6,2) not null,
  unit text not null default 'lb',
  body_fat_percentage numeric(5,2),
  measured_at timestamptz not null,
  entry_date date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bodyweight_entries_weight_check
    check (weight > 0),
  constraint bodyweight_entries_unit_check
    check (unit in ('lb', 'kg')),
  constraint bodyweight_entries_body_fat_percentage_check
    check (body_fat_percentage is null or (body_fat_percentage >= 0 and body_fat_percentage <= 100))
);

create table public.performance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete set null,
  exercise_entry_id uuid references public.exercise_entries (id) on delete set null,
  exercise_name text,
  metric_name text not null,
  value numeric(10,2) not null,
  unit text,
  reps integer,
  weight numeric(8,2),
  duration_seconds integer,
  distance numeric(10,2),
  recorded_at timestamptz not null,
  entry_date date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint performance_entries_value_check
    check (value >= 0),
  constraint performance_entries_reps_check
    check (reps is null or reps >= 0),
  constraint performance_entries_weight_check
    check (weight is null or weight >= 0),
  constraint performance_entries_duration_seconds_check
    check (duration_seconds is null or duration_seconds >= 0),
  constraint performance_entries_distance_check
    check (distance is null or distance >= 0)
);

create index workouts_user_id_workout_date_idx
  on public.workouts (user_id, workout_date desc);

create index exercise_entries_workout_id_order_index_idx
  on public.exercise_entries (workout_id, order_index);

create index exercise_entries_user_id_performed_at_idx
  on public.exercise_entries (user_id, performed_at desc);

create index bodyweight_entries_user_id_entry_date_idx
  on public.bodyweight_entries (user_id, entry_date desc);

create index performance_entries_user_id_entry_date_idx
  on public.performance_entries (user_id, entry_date desc);

commit;
