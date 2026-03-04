// types.ts
// Shared type definitions for the SciFit analytics module.
// All analytics files import from here — do not redefine these elsewhere.

// ── Raw data types (mirrors Supabase table schemas) ────────────────────────

export interface SetEntry {
  exercise_name: string;
  set_number: number;
  reps: number;
  weight: number; // kg
  date: string;   // ISO date string e.g. "2026-02-17"
}

export interface WorkoutSession {
  date: string; // ISO date string
}

// ── Analytics result types ─────────────────────────────────────────────────

export type MuscleGroup =
  | "Chest"
  | "Front Deltoid"
  | "Middle Deltoid"
  | "Rear Deltoid"
  | "Triceps"
  | "Biceps"
  | "Brachialis"
  | "Forearms"
  | "Lats"
  | "Middle Trapezius"
  | "Upper Trapezius"
  | "Erector Spinae"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Abs"
  | "Obliques"
  | "Hip Flexors"
  | "Rotator Cuff";

export type VolumeStatus = "UNDERTRAINED" | "APPROACHING" | "OPTIMAL" | "OVERTRAINED";
export type PRType = "WEIGHT" | "VOLUME" | "REPS_AT_WEIGHT" | "ESTIMATED_1RM";
export type ConsistencyTier = "ELITE" | "CONSISTENT" | "MODERATE" | "INCONSISTENT";
export type PlateauSeverity = "MILD" | "MODERATE" | "SEVERE";

export interface MuscleVolumeResult {
  muscle: MuscleGroup;
  weekly_sets: number;
  status: VolumeStatus;
  too_little_threshold: number;
  optimal_min: number;
  optimal_max: number;
  too_much_threshold: number;
}

export interface PRResult {
  exercise_name: string;
  pr_type: PRType;
  new_value: number;
  previous_best: number | null;
  date: string;
  label: string;
}

export interface ConsistencyResult {
  score: number;
  tier: ConsistencyTier;
  label: string;
  actual_days: number;
  target_days: number;
  current_streak_weeks: number;
  longest_streak_weeks: number;
}

export interface PlateauResult {
  exercise_name: string;
  severity: PlateauSeverity;
  weeks_stalled: number;
  suggestion: string;
  week1_1rm: number;
  week3_1rm: number;
}

export interface MuscleContribution {
  muscle: MuscleGroup;
  weight: number; // 1.0 = primary, 0.5 = secondary, 0.25 = incidental
}

export interface ExerciseMapping {
  exercise_name: string;
  muscles: MuscleContribution[];
}
