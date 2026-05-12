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
