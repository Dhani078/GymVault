/**
 * GymVault TypeScript Type Definitions & API Contracts
 * Certified 10/10 Silicon Valley Standard
 */

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email?: string;
  body_weight?: number;
  height?: number;
  cns_fatigue?: number;
  custom_routines?: CustomRoutine[];
  role: 'admin' | 'user';
  is_premium: boolean;
  premium_plan?: 'monthly' | 'yearly';
  premium_until?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface CustomRoutine {
  id: string;
  name: string;
  exercises: {
    name: string;
    image?: string;
    numSets: number;
    muscle_group?: string;
  }[];
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscle_group: string;
  secondary_muscles?: string[];
  equipment_type: string;
  level?: string;
  thumbnail_url?: string;
  images?: string[];
  instructions?: string;
}

export interface WorkoutSet {
  id?: string;
  session_id?: string;
  exercise_id?: string | null;
  set_index: number;
  weight_kg: number;
  reps: number;
  is_checked: boolean;
  completed?: boolean;
  kg?: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  split_name?: string;
  started_at: string;
  is_completed: boolean;
  workout_sets?: WorkoutSet[];
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at: string;
}

export interface CustomMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size?: string;
  created_at: string;
}

export interface MuscleRecoveryState {
  status: 'Fresh' | 'Recovering' | 'Fatigued';
  percentage: number;
  hoursAgo: number;
  isOverride?: boolean;
}
