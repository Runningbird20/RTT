create extension if not exists "pgcrypto";

create type public.workout_intensity as enum ('Easy', 'Moderate', 'Hard');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  notes text,
  performed_at timestamptz not null default timezone('utc', now()),
  duration_minutes integer,
  intensity public.workout_intensity not null default 'Moderate',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workouts_duration_minutes_check check (duration_minutes is null or duration_minutes >= 0)
);

create table if not exists public.exercise_entries (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  exercise_name text not null,
  sets integer,
  reps integer,
  load numeric(8,2),
  order_index integer not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint exercise_entries_sets_check check (sets is null or sets >= 0),
  constraint exercise_entries_reps_check check (reps is null or reps >= 0),
  constraint exercise_entries_load_check check (load is null or load >= 0),
  constraint exercise_entries_order_index_check check (order_index >= 0)
);

create table if not exists public.bodyweight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  weight numeric(6,2) not null,
  unit text not null default 'lb',
  measured_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bodyweight_entries_weight_check check (weight > 0),
  constraint bodyweight_entries_unit_check check (unit in ('lb', 'kg'))
);

create table if not exists public.performance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete set null,
  exercise_name text,
  metric_name text not null,
  value numeric(10,2) not null,
  unit text,
  recorded_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint performance_entries_value_check check (value >= 0)
);

create index if not exists workouts_user_id_performed_at_idx
  on public.workouts (user_id, performed_at desc);

create index if not exists exercise_entries_workout_id_order_index_idx
  on public.exercise_entries (workout_id, order_index);

create index if not exists exercise_entries_user_id_created_at_idx
  on public.exercise_entries (user_id, created_at desc);

create index if not exists bodyweight_entries_user_id_measured_at_idx
  on public.bodyweight_entries (user_id, measured_at desc);

create index if not exists performance_entries_user_id_recorded_at_idx
  on public.performance_entries (user_id, recorded_at desc);

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
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
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

create or replace function public.ensure_workout_belongs_to_user()
returns trigger
language plpgsql
as $$
begin
  if new.workout_id is null then
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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

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

drop trigger if exists exercise_entries_verify_workout_owner on public.exercise_entries;
create trigger exercise_entries_verify_workout_owner
before insert or update on public.exercise_entries
for each row
execute function public.ensure_workout_belongs_to_user();

drop trigger if exists bodyweight_entries_set_updated_at on public.bodyweight_entries;
create trigger bodyweight_entries_set_updated_at
before update on public.bodyweight_entries
for each row
execute function public.set_updated_at();

drop trigger if exists performance_entries_set_updated_at on public.performance_entries;
create trigger performance_entries_set_updated_at
before update on public.performance_entries
for each row
execute function public.set_updated_at();

drop trigger if exists performance_entries_verify_workout_owner on public.performance_entries;
create trigger performance_entries_verify_workout_owner
before insert or update on public.performance_entries
for each row
execute function public.ensure_workout_belongs_to_user();

alter table public.users enable row level security;
alter table public.workouts enable row level security;
alter table public.exercise_entries enable row level security;
alter table public.bodyweight_entries enable row level security;
alter table public.performance_entries enable row level security;

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
