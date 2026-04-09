import type { Session } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/lib/supabase';
import type {
  BodyweightEntryRecord,
  BodyweightFormValues,
  ExerciseEntryRecord,
  PerformanceEntryRecord,
  PerformanceFormValues,
  WorkoutFormValues,
  WorkoutRecord,
} from '@/lib/types';
import { resolveAppUserId } from '@/lib/userProfile';

type WorkoutRow = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  performed_at: string;
  workout_date: string;
  duration_minutes: number | null;
  intensity: WorkoutRecord['intensity'];
  location: string | null;
  created_at: string;
  updated_at: string;
};

type BodyweightRow = {
  id: string;
  user_id: string;
  workout_id: string | null;
  weight: number;
  unit: 'lb' | 'kg';
  entry_date: string;
  measured_at: string;
  body_fat_percentage: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ExerciseEntryRow = {
  id: string;
  workout_id: string;
  user_id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  load: number | null;
  weight_unit: 'lb' | 'kg';
  order_index: number;
  performed_at: string;
  rest_seconds: number | null;
  rpe: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PerformanceRow = {
  id: string;
  user_id: string;
  workout_id: string | null;
  exercise_entry_id: string | null;
  exercise_name: string | null;
  metric_name: string;
  value: number;
  unit: string | null;
  entry_date: string;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  distance: number | null;
  recorded_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapWorkoutRow(row: WorkoutRow): WorkoutRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    notes: row.notes,
    performedAt: row.performed_at,
    workoutDate: row.workout_date,
    durationMinutes: row.duration_minutes,
    intensity: row.intensity,
    location: row.location,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBodyweightRow(row: BodyweightRow): BodyweightEntryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    workoutId: row.workout_id,
    weight: Number(row.weight),
    unit: row.unit,
    entryDate: row.entry_date,
    measuredAt: row.measured_at,
    bodyFatPercentage: row.body_fat_percentage === null ? null : Number(row.body_fat_percentage),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExerciseEntryRow(row: ExerciseEntryRow): ExerciseEntryRecord {
  return {
    id: row.id,
    workoutId: row.workout_id,
    userId: row.user_id,
    exerciseName: row.exercise_name,
    sets: row.sets,
    reps: row.reps,
    load: row.load === null ? null : Number(row.load),
    weightUnit: row.weight_unit,
    orderIndex: row.order_index,
    performedAt: row.performed_at,
    restSeconds: row.rest_seconds,
    rpe: row.rpe === null ? null : Number(row.rpe),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPerformanceRow(row: PerformanceRow): PerformanceEntryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    workoutId: row.workout_id,
    exerciseEntryId: row.exercise_entry_id,
    exerciseName: row.exercise_name,
    metricName: row.metric_name,
    value: Number(row.value),
    unit: row.unit,
    entryDate: row.entry_date,
    reps: row.reps,
    weight: row.weight === null ? null : Number(row.weight),
    durationSeconds: row.duration_seconds,
    distance: row.distance === null ? null : Number(row.distance),
    recordedAt: row.recorded_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildTimestampFromLabel(label: string): string {
  const trimmed = label.trim();

  if (!trimmed) {
    return new Date().toISOString();
  }

  const parsed = new Date(trimmed);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

function buildBodyweightNotes(values: BodyweightFormValues): string | null {
  const parts = [values.measuredAt.trim(), values.notes.trim()].filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : null;
}

export async function fetchLatestWorkout(session: Session | null): Promise<WorkoutRecord | null> {
  const client = getSupabaseClient();
  const userId = await resolveAppUserId(session);
  const { data, error } = await client
    .from('workouts')
    .select(
      'id, user_id, title, notes, performed_at, workout_date, duration_minutes, intensity, location, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(1)
    .maybeSingle<WorkoutRow>();

  if (error) {
    throw error;
  }

  return data ? mapWorkoutRow(data) : null;
}

export async function fetchRecentWorkouts(
  session: Session | null,
  limit = 8
): Promise<WorkoutRecord[]> {
  const client = getSupabaseClient();
  const userId = await resolveAppUserId(session);
  const { data, error } = await client
    .from('workouts')
    .select(
      'id, user_id, title, notes, performed_at, workout_date, duration_minutes, intensity, location, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(limit)
    .returns<WorkoutRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapWorkoutRow);
}

export async function fetchRecentBodyweightEntries(
  session: Session | null,
  limit = 8
): Promise<BodyweightEntryRecord[]> {
  const client = getSupabaseClient();
  const userId = await resolveAppUserId(session);
  const { data, error } = await client
    .from('bodyweight_entries')
    .select(
      'id, user_id, workout_id, weight, unit, entry_date, measured_at, body_fat_percentage, notes, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(limit)
    .returns<BodyweightRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapBodyweightRow).reverse();
}

export async function fetchRecentPerformanceEntries(
  session: Session | null,
  limit = 8
): Promise<PerformanceEntryRecord[]> {
  const client = getSupabaseClient();
  const userId = await resolveAppUserId(session);
  const { data, error } = await client
    .from('performance_entries')
    .select(
      'id, user_id, workout_id, exercise_entry_id, exercise_name, metric_name, value, unit, entry_date, reps, weight, duration_seconds, distance, recorded_at, notes, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit)
    .returns<PerformanceRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPerformanceRow).reverse();
}

export async function createWorkout(
  session: Session | null,
  values: WorkoutFormValues
): Promise<WorkoutRecord> {
  const client = getSupabaseClient();
  const userId = await resolveAppUserId(session);
  const now = new Date();
  const { data, error } = await client
    .from('workouts')
    .insert({
      user_id: userId,
      title: values.workoutName.trim() || 'Workout',
      notes: values.notes.trim() || null,
      performed_at: now.toISOString(),
      workout_date: now.toISOString().slice(0, 10),
      duration_minutes: values.durationMinutes ? Number(values.durationMinutes) : null,
      intensity: values.intensity,
      location: null,
    })
    .select(
      'id, user_id, title, notes, performed_at, workout_date, duration_minutes, intensity, location, created_at, updated_at'
    )
    .single<WorkoutRow>();

  if (error) {
    throw error;
  }

  return mapWorkoutRow(data);
}

export async function createBodyweightEntry(
  session: Session | null,
  values: BodyweightFormValues,
  workoutId: string | null
): Promise<BodyweightEntryRecord> {
  const client = getSupabaseClient();
  const userId = await resolveAppUserId(session);
  const parsedWeight = Number(values.weight);

  if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
    throw new Error('Enter a valid bodyweight value before saving.');
  }

  const measuredAt = buildTimestampFromLabel(values.measuredAt);
  const { data, error } = await client
    .from('bodyweight_entries')
    .insert({
      user_id: userId,
      workout_id: workoutId,
      weight: parsedWeight,
      unit: 'lb',
      entry_date: measuredAt.slice(0, 10),
      measured_at: measuredAt,
      body_fat_percentage: null,
      notes: buildBodyweightNotes(values),
    })
    .select(
      'id, user_id, workout_id, weight, unit, entry_date, measured_at, body_fat_percentage, notes, created_at, updated_at'
    )
    .single<BodyweightRow>();

  if (error) {
    throw error;
  }

  return mapBodyweightRow(data);
}

export async function createExerciseAndPerformanceEntry(
  session: Session | null,
  workoutId: string,
  values: PerformanceFormValues
): Promise<{
  exerciseEntry: ExerciseEntryRecord;
  performanceEntry: PerformanceEntryRecord;
}> {
  const client = getSupabaseClient();
  const userId = await resolveAppUserId(session);
  const now = new Date().toISOString();
  const sets = values.sets ? Number(values.sets) : null;
  const reps = values.reps ? Number(values.reps) : null;
  const load = values.load ? Number(values.load) : null;

  if (!values.exercise.trim()) {
    throw new Error('Enter an exercise name before saving performance.');
  }

  if (sets === null && reps === null && load === null) {
    throw new Error('Enter at least one performance metric such as sets, reps, or load.');
  }

  if ([sets, reps, load].some((value) => value !== null && Number.isNaN(value))) {
    throw new Error('Performance metrics must be valid numbers.');
  }

  const { data: exerciseData, error: exerciseError } = await client
    .from('exercise_entries')
    .insert({
      workout_id: workoutId,
      user_id: userId,
      exercise_name: values.exercise.trim() || 'Exercise',
      sets,
      reps,
      load,
      weight_unit: 'lb',
      order_index: 0,
      performed_at: now,
      rest_seconds: null,
      rpe: null,
      notes: values.notes.trim() || null,
    })
    .select(
      'id, workout_id, user_id, exercise_name, sets, reps, load, weight_unit, order_index, performed_at, rest_seconds, rpe, notes, created_at, updated_at'
    )
    .single<ExerciseEntryRow>();

  if (exerciseError) {
    throw exerciseError;
  }

  const metricName = load !== null ? 'working_set_load' : reps !== null ? 'working_set_reps' : 'working_set_sets';
  const metricValue = load ?? reps ?? sets ?? 0;
  const metricUnit = load !== null ? 'lb' : reps !== null ? 'reps' : 'sets';

  const { data: performanceData, error: performanceError } = await client
    .from('performance_entries')
    .insert({
      user_id: userId,
      workout_id: workoutId,
      exercise_entry_id: exerciseData.id,
      exercise_name: values.exercise.trim() || 'Exercise',
      metric_name: metricName,
      value: metricValue,
      unit: metricUnit,
      entry_date: now.slice(0, 10),
      reps,
      weight: load,
      duration_seconds: null,
      distance: null,
      recorded_at: now,
      notes: values.notes.trim() || null,
    })
    .select(
      'id, user_id, workout_id, exercise_entry_id, exercise_name, metric_name, value, unit, entry_date, reps, weight, duration_seconds, distance, recorded_at, notes, created_at, updated_at'
    )
    .single<PerformanceRow>();

  if (performanceError) {
    throw performanceError;
  }

  return {
    exerciseEntry: mapExerciseEntryRow(exerciseData),
    performanceEntry: mapPerformanceRow(performanceData),
  };
}
