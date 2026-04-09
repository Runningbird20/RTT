-- Remap imported CSV data from placeholder user UUIDs to real auth.users UUIDs.
-- Run this in the Supabase SQL Editor after creating the corresponding Auth users.
--
-- Expected flow:
-- 1. Create auth users for the imported emails in Authentication > Users.
-- 2. Run this script.
-- 3. Sign out/in again in the app.
--
-- This preserves workouts/bodyweight/performance rows and makes RLS policies based
-- on auth.uid() line up with the imported data.

begin;

create temporary table user_id_map as
select
  pu.id as old_user_id,
  au.id as new_user_id,
  lower(pu.email) as email
from public.users pu
join auth.users au
  on lower(au.email) = lower(pu.email)
where pu.id <> au.id;

do $$
begin
  if not exists (select 1 from user_id_map) then
    raise exception 'No imported users were found that need remapping. Make sure auth.users contains the same emails as public.users.';
  end if;
end
$$;

alter table public.workouts
  drop constraint if exists workouts_user_id_fkey;

alter table public.exercise_entries
  drop constraint if exists exercise_entries_user_id_fkey;

alter table public.bodyweight_entries
  drop constraint if exists bodyweight_entries_user_id_fkey;

alter table public.performance_entries
  drop constraint if exists performance_entries_user_id_fkey;

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

alter table public.workouts
  add constraint workouts_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.exercise_entries
  add constraint exercise_entries_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.bodyweight_entries
  add constraint bodyweight_entries_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.performance_entries
  add constraint performance_entries_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

commit;
