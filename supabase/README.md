# Supabase Schema

Apply the SQL files in `supabase/migrations/` in order in the Supabase SQL Editor, or wire this folder into the Supabase CLI later if you want migration commands in-repo.

Tables created:

- `public.users`
- `public.workouts`
- `public.exercise_entries`
- `public.bodyweight_entries`
- `public.performance_entries`

The migration also adds:

- `public.workout_intensity` enum
- `updated_at` trigger support
- an `auth.users` trigger that upserts into `public.users`
- row-level security policies scoped to `auth.uid()`
- richer metric/date fields like `workout_date`, `weight`, `reps`, `entry_date`, `rpe`, and `body_fat_percentage`
- extra foreign-key links from `bodyweight_entries -> workouts` and `performance_entries -> exercise_entries`
