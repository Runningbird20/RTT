export type WorkoutIntensity = 'Easy' | 'Moderate' | 'Hard';

export type ChartPoint = {
  label: string;
  value: number;
};

export type WorkoutEntry = {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  intensity: WorkoutIntensity;
  notes: string;
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
