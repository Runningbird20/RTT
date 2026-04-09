alter table public.workouts
  add column if not exists workout_date date not null default current_date,
  add column if not exists location text;

alter table public.exercise_entries
  add column if not exists performed_at timestamptz not null default timezone('utc', now()),
  add column if not exists weight_unit text not null default 'lb',
  add column if not exists rest_seconds integer,
  add column if not exists rpe numeric(3,1);

alter table public.bodyweight_entries
  add column if not exists workout_id uuid references public.workouts (id) on delete set null,
  add column if not exists entry_date date not null default current_date,
  add column if not exists body_fat_percentage numeric(5,2);

alter table public.performance_entries
  add column if not exists exercise_entry_id uuid references public.exercise_entries (id) on delete set null,
  add column if not exists entry_date date not null default current_date,
  add column if not exists reps integer,
  add column if not exists weight numeric(8,2),
  add column if not exists duration_seconds integer,
  add column if not exists distance numeric(10,2);

alter table public.exercise_entries
  drop constraint if exists exercise_entries_weight_unit_check;

alter table public.exercise_entries
  add constraint exercise_entries_weight_unit_check
  check (weight_unit in ('lb', 'kg'));

alter table public.exercise_entries
  drop constraint if exists exercise_entries_rest_seconds_check;

alter table public.exercise_entries
  add constraint exercise_entries_rest_seconds_check
  check (rest_seconds is null or rest_seconds >= 0);

alter table public.exercise_entries
  drop constraint if exists exercise_entries_rpe_check;

alter table public.exercise_entries
  add constraint exercise_entries_rpe_check
  check (rpe is null or (rpe >= 0 and rpe <= 10));

alter table public.bodyweight_entries
  drop constraint if exists bodyweight_entries_body_fat_percentage_check;

alter table public.bodyweight_entries
  add constraint bodyweight_entries_body_fat_percentage_check
  check (body_fat_percentage is null or (body_fat_percentage >= 0 and body_fat_percentage <= 100));

alter table public.performance_entries
  drop constraint if exists performance_entries_reps_check;

alter table public.performance_entries
  add constraint performance_entries_reps_check
  check (reps is null or reps >= 0);

alter table public.performance_entries
  drop constraint if exists performance_entries_weight_check;

alter table public.performance_entries
  add constraint performance_entries_weight_check
  check (weight is null or weight >= 0);

alter table public.performance_entries
  drop constraint if exists performance_entries_duration_seconds_check;

alter table public.performance_entries
  add constraint performance_entries_duration_seconds_check
  check (duration_seconds is null or duration_seconds >= 0);

alter table public.performance_entries
  drop constraint if exists performance_entries_distance_check;

alter table public.performance_entries
  add constraint performance_entries_distance_check
  check (distance is null or distance >= 0);

create index if not exists workouts_user_id_workout_date_idx
  on public.workouts (user_id, workout_date desc);

create index if not exists exercise_entries_user_id_performed_at_idx
  on public.exercise_entries (user_id, performed_at desc);

create index if not exists bodyweight_entries_workout_id_idx
  on public.bodyweight_entries (workout_id);

create index if not exists performance_entries_exercise_entry_id_idx
  on public.performance_entries (exercise_entry_id);

create or replace function public.ensure_exercise_entry_belongs_to_user()
returns trigger
language plpgsql
as $$
declare
  linked_workout_id uuid;
begin
  if new.exercise_entry_id is null then
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

drop trigger if exists bodyweight_entries_verify_workout_owner on public.bodyweight_entries;
create trigger bodyweight_entries_verify_workout_owner
before insert or update on public.bodyweight_entries
for each row
execute function public.ensure_workout_belongs_to_user();

drop trigger if exists performance_entries_verify_exercise_owner on public.performance_entries;
create trigger performance_entries_verify_exercise_owner
before insert or update on public.performance_entries
for each row
execute function public.ensure_exercise_entry_belongs_to_user();
