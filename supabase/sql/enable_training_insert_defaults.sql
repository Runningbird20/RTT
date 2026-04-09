-- Add UUID defaults so the Expo app can insert new rows without manually
-- supplying an id for each training table.

begin;

create extension if not exists pgcrypto;

alter table public.workouts
  alter column id set default gen_random_uuid();

alter table public.exercise_entries
  alter column id set default gen_random_uuid();

alter table public.bodyweight_entries
  alter column id set default gen_random_uuid();

alter table public.performance_entries
  alter column id set default gen_random_uuid();

commit;
