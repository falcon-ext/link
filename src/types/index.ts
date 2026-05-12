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
