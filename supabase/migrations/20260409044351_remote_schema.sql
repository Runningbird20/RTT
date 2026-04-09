drop extension if exists "pg_net";

drop trigger if exists "bodyweight_entries_set_updated_at" on "public"."bodyweight_entries";

drop trigger if exists "exercise_entries_set_updated_at" on "public"."exercise_entries";

drop trigger if exists "performance_entries_set_updated_at" on "public"."performance_entries";

drop trigger if exists "performance_entries_verify_workout_owner" on "public"."performance_entries";

drop trigger if exists "users_set_updated_at" on "public"."users";

drop trigger if exists "workouts_set_updated_at" on "public"."workouts";

drop policy "Users can manage their own bodyweight entries" on "public"."bodyweight_entries";

drop policy "Users can manage their own exercise entries" on "public"."exercise_entries";

drop policy "Users can manage their own performance entries" on "public"."performance_entries";

drop policy "Users can delete their own profile" on "public"."users";

drop policy "Users can insert their own profile" on "public"."users";

drop policy "Users can update their own profile" on "public"."users";

drop policy "Users can view their own profile" on "public"."users";

drop policy "Users can manage their own workouts" on "public"."workouts";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

alter table "public"."bodyweight_entries" drop constraint "bodyweight_entries_unit_check";

alter table "public"."bodyweight_entries" drop constraint "bodyweight_entries_weight_check";

alter table "public"."exercise_entries" drop constraint "exercise_entries_load_check";

alter table "public"."exercise_entries" drop constraint "exercise_entries_order_index_check";

alter table "public"."exercise_entries" drop constraint "exercise_entries_reps_check";

alter table "public"."exercise_entries" drop constraint "exercise_entries_sets_check";

alter table "public"."performance_entries" drop constraint "performance_entries_value_check";

alter table "public"."performance_entries" drop constraint "performance_entries_workout_id_fkey";

alter table "public"."users" drop constraint "users_email_key";

alter table "public"."users" drop constraint "users_id_fkey";

alter table "public"."workouts" drop constraint "workouts_duration_minutes_check";

alter table "public"."bodyweight_entries" drop constraint "bodyweight_entries_user_id_fkey";

alter table "public"."exercise_entries" drop constraint "exercise_entries_user_id_fkey";

alter table "public"."performance_entries" drop constraint "performance_entries_user_id_fkey";

alter table "public"."workouts" drop constraint "workouts_user_id_fkey";

drop function if exists "public"."handle_new_user"();

drop function if exists "public"."set_updated_at"();

alter table "public"."users" drop constraint "users_pkey";

drop index if exists "public"."bodyweight_entries_user_id_measured_at_idx";

drop index if exists "public"."exercise_entries_user_id_created_at_idx";

drop index if exists "public"."exercise_entries_workout_id_order_index_idx";

drop index if exists "public"."performance_entries_user_id_recorded_at_idx";

drop index if exists "public"."users_email_key";

drop index if exists "public"."users_pkey";

drop index if exists "public"."workouts_user_id_performed_at_idx";

drop table "public"."users";


  create table "public"."profiles" (
    "id" uuid not null,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "username" text,
    "target_weight" numeric,
    "created_at_local" timestamp with time zone
      );


alter table "public"."profiles" enable row level security;

alter table "public"."bodyweight_entries" drop column "notes";

alter table "public"."bodyweight_entries" drop column "unit";

alter table "public"."bodyweight_entries" drop column "updated_at";

alter table "public"."bodyweight_entries" add column "date" date not null;

alter table "public"."bodyweight_entries" add column "weight_unit" text default 'lb'::text;

alter table "public"."bodyweight_entries" alter column "created_at" drop not null;

alter table "public"."bodyweight_entries" alter column "measured_at" drop default;

alter table "public"."bodyweight_entries" alter column "measured_at" drop not null;

alter table "public"."bodyweight_entries" alter column "user_id" drop not null;

alter table "public"."bodyweight_entries" alter column "weight" set data type numeric using "weight"::numeric;

alter table "public"."exercise_entries" drop column "load";

alter table "public"."exercise_entries" drop column "notes";

alter table "public"."exercise_entries" drop column "updated_at";

alter table "public"."exercise_entries" add column "is_pr" boolean default false;

alter table "public"."exercise_entries" add column "weight" numeric;

alter table "public"."exercise_entries" alter column "created_at" drop not null;

alter table "public"."exercise_entries" alter column "order_index" drop default;

alter table "public"."exercise_entries" alter column "order_index" drop not null;

alter table "public"."exercise_entries" alter column "order_index" set data type smallint using "order_index"::smallint;

alter table "public"."exercise_entries" alter column "user_id" drop not null;

alter table "public"."exercise_entries" alter column "workout_id" drop not null;

alter table "public"."performance_entries" drop column "exercise_name";

alter table "public"."performance_entries" drop column "metric_name";

alter table "public"."performance_entries" drop column "notes";

alter table "public"."performance_entries" drop column "updated_at";

alter table "public"."performance_entries" drop column "workout_id";

alter table "public"."performance_entries" add column "date" date not null;

alter table "public"."performance_entries" add column "metric_type" text not null;

alter table "public"."performance_entries" alter column "created_at" drop not null;

alter table "public"."performance_entries" alter column "recorded_at" drop default;

alter table "public"."performance_entries" alter column "recorded_at" drop not null;

alter table "public"."performance_entries" alter column "unit" set not null;

alter table "public"."performance_entries" alter column "user_id" drop not null;

alter table "public"."performance_entries" alter column "value" set data type numeric using "value"::numeric;

alter table "public"."workouts" drop column "duration_minutes";

alter table "public"."workouts" drop column "intensity";

alter table "public"."workouts" drop column "title";

alter table "public"."workouts" drop column "updated_at";

alter table "public"."workouts" add column "date" date not null;

alter table "public"."workouts" add column "session_type" text;

alter table "public"."workouts" alter column "created_at" drop not null;

alter table "public"."workouts" alter column "performed_at" drop default;

alter table "public"."workouts" alter column "performed_at" drop not null;

alter table "public"."workouts" alter column "user_id" drop not null;

drop type "public"."workout_intensity";

CREATE INDEX bodyweight_entries_user_id_idx ON public.bodyweight_entries USING btree (user_id);

CREATE INDEX exercise_entries_user_id_idx ON public.exercise_entries USING btree (user_id);

CREATE INDEX exercise_entries_workout_id_idx ON public.exercise_entries USING btree (workout_id);

CREATE INDEX performance_entries_user_id_idx ON public.performance_entries USING btree (user_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX workouts_user_id_idx ON public.workouts USING btree (user_id);

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."bodyweight_entries" add constraint "bodyweight_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."bodyweight_entries" validate constraint "bodyweight_entries_user_id_fkey";

alter table "public"."exercise_entries" add constraint "exercise_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."exercise_entries" validate constraint "exercise_entries_user_id_fkey";

alter table "public"."performance_entries" add constraint "performance_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."performance_entries" validate constraint "performance_entries_user_id_fkey";

alter table "public"."workouts" add constraint "workouts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."workouts" validate constraint "workouts_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_workout_belongs_to_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.workout_id is not null then
    if not exists (
      select 1
      from public.workouts w
      where w.id = new.workout_id
        and w.user_id = new.user_id
    ) then
      raise exception 'workout_id does not belong to user_id';
    end if;
  end if;

  return new;
end;
$function$
;

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "Allow all bodyweight_entries"
  on "public"."bodyweight_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all exercise_entries"
  on "public"."exercise_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all performance_entries"
  on "public"."performance_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all profiles"
  on "public"."profiles"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all workouts"
  on "public"."workouts"
  as permissive
  for all
  to public
using (true)
with check (true);


drop trigger if exists "on_auth_user_created" on "auth"."users";


