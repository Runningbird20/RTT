# Training backend CSV test data

This folder contains sample CSV data aligned with the Supabase schema in `supabase/migrations/`.

## Files

- `users.csv`
- `workouts.csv`
- `exercise_entries.csv`
- `bodyweight_entries.csv`
- `performance_entries.csv`

## Import order

To satisfy foreign keys, import in this order:

1. `users.csv`
2. `workouts.csv`
3. `exercise_entries.csv`
4. `bodyweight_entries.csv`
5. `performance_entries.csv`

## Notes

- IDs are fixed UUIDs so records can cross-reference cleanly.
- Timestamps are UTC ISO-8601.
- Numeric values respect constraints (e.g., non-negative weight/load, RPE 0-10).
