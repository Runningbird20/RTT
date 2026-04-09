export type WorkoutIntensity = 'Easy' | 'Moderate' | 'Hard';

export type ChartPoint = {
  label: string;
  value: number;
};

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutEntry = {
  id: string;
  userId?: string;
  title: string;
  date: string;
  durationMinutes: number;
  intensity: WorkoutIntensity;
  notes: string;
};

export type WorkoutRecord = {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  performedAt: string;
  workoutDate: string;
  durationMinutes: number | null;
  intensity: WorkoutIntensity;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseEntryRecord = {
  id: string;
  workoutId: string;
  userId: string;
  exerciseName: string;
  sets: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: 'lb' | 'kg';
  orderIndex: number;
  performedAt: string;
  restSeconds: number | null;
  rpe: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BodyweightEntryRecord = {
  id: string;
  userId: string;
  workoutId: string | null;
  weight: number;
  unit: 'lb' | 'kg';
  entryDate: string;
  measuredAt: string;
  bodyFatPercentage: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PerformanceEntryRecord = {
  id: string;
  userId: string;
  workoutId: string | null;
  exerciseEntryId: string | null;
  exerciseName: string | null;
  metricName: string;
  value: number;
  unit: string | null;
  entryDate: string;
  reps: number | null;
  weight: number | null;
  durationSeconds: number | null;
  distance: number | null;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutFormValues = {
  workoutName: string;
  durationMinutes: string;
  intensity: WorkoutIntensity;
  notes: string;
};

export type BodyweightFormValues = {
  weight: string;
  measuredAt: string;
  notes: string;
};

export type PerformanceFormValues = {
  exercise: string;
  sets: string;
  reps: string;
  load: string;
  notes: string;
};
