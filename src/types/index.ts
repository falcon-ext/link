export type UserRole = 'trainer' | 'student';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  goal: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

export type MuscleGroup =
  | 'chest' | 'back' | 'legs' | 'shoulders'
  | 'biceps' | 'triceps' | 'core' | 'cardio' | 'other';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment: string | null;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  is_custom: boolean;
  created_at: string;
}

export interface Program {
  id: string;
  student_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkoutSheet {
  id: string;
  program_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface SheetExercise {
  id: string;
  sheet_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  load: string | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  exercise?: Exercise;
}
