-- Reapply the RLS policies expected by the Expo app.
-- Run this in the Supabase SQL Editor.

begin;

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

commit;
