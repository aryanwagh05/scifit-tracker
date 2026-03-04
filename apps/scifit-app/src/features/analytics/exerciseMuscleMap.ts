// exerciseMuscleMap.ts
import type { MuscleGroup, MuscleContribution, ExerciseMapping } from "./types";

export type { MuscleGroup, MuscleContribution, ExerciseMapping };

export const EXERCISE_MUSCLE_MAP: ExerciseMapping[] = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  { exercise_name: "Bench Press",          muscles: [{ muscle: "Chest", weight: 1.0 }, { muscle: "Triceps", weight: 0.5 }, { muscle: "Front Deltoid", weight: 0.5 }] },
  { exercise_name: "Incline Bench Press",  muscles: [{ muscle: "Chest", weight: 1.0 }, { muscle: "Front Deltoid", weight: 1.0 }, { muscle: "Triceps", weight: 0.5 }] },
  { exercise_name: "Decline Bench Press",  muscles: [{ muscle: "Chest", weight: 1.0 }, { muscle: "Triceps", weight: 0.5 }] },
  { exercise_name: "Dumbbell Fly",         muscles: [{ muscle: "Chest", weight: 1.0 }, { muscle: "Front Deltoid", weight: 0.5 }] },
  { exercise_name: "Cable Crossover",      muscles: [{ muscle: "Chest", weight: 1.0 }, { muscle: "Front Deltoid", weight: 0.5 }] },
  { exercise_name: "Push-Up",              muscles: [{ muscle: "Chest", weight: 1.0 }, { muscle: "Triceps", weight: 0.5 }, { muscle: "Front Deltoid", weight: 0.5 }] },
  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  { exercise_name: "Overhead Press",       muscles: [{ muscle: "Front Deltoid", weight: 1.0 }, { muscle: "Middle Deltoid", weight: 1.0 }, { muscle: "Triceps", weight: 0.5 }, { muscle: "Chest", weight: 0.25 }] },
  { exercise_name: "Arnold Press",         muscles: [{ muscle: "Front Deltoid", weight: 1.0 }, { muscle: "Middle Deltoid", weight: 1.0 }, { muscle: "Triceps", weight: 0.5 }] },
  { exercise_name: "Lateral Raise",        muscles: [{ muscle: "Middle Deltoid", weight: 1.0 }] },
  { exercise_name: "Front Raise",          muscles: [{ muscle: "Front Deltoid", weight: 1.0 }] },
  { exercise_name: "Rear Delt Fly",        muscles: [{ muscle: "Rear Deltoid", weight: 1.0 }, { muscle: "Middle Trapezius", weight: 0.5 }] },
  { exercise_name: "Face Pull",            muscles: [{ muscle: "Rear Deltoid", weight: 1.0 }, { muscle: "Rotator Cuff", weight: 0.5 }] },
  // ── TRICEPS ────────────────────────────────────────────────────────────────
  { exercise_name: "Triceps Pushdown",           muscles: [{ muscle: "Triceps", weight: 1.0 }] },
  { exercise_name: "Skull Crusher",              muscles: [{ muscle: "Triceps", weight: 1.0 }] },
  { exercise_name: "Close-Grip Bench Press",     muscles: [{ muscle: "Triceps", weight: 1.0 }, { muscle: "Chest", weight: 0.5 }] },
  { exercise_name: "Overhead Triceps Extension", muscles: [{ muscle: "Triceps", weight: 1.0 }] },
  { exercise_name: "Dip",                        muscles: [{ muscle: "Triceps", weight: 1.0 }, { muscle: "Chest", weight: 1.0 }, { muscle: "Front Deltoid", weight: 0.5 }] },
  // ── BICEPS ─────────────────────────────────────────────────────────────────
  { exercise_name: "Barbell Curl",  muscles: [{ muscle: "Biceps", weight: 1.0 }, { muscle: "Brachialis", weight: 0.5 }] },
  { exercise_name: "Dumbbell Curl", muscles: [{ muscle: "Biceps", weight: 1.0 }, { muscle: "Brachialis", weight: 0.5 }] },
  { exercise_name: "Hammer Curl",   muscles: [{ muscle: "Brachialis", weight: 1.0 }, { muscle: "Biceps", weight: 0.5 }, { muscle: "Forearms", weight: 0.5 }] },
  { exercise_name: "Preacher Curl", muscles: [{ muscle: "Biceps", weight: 1.0 }] },
  { exercise_name: "Cable Curl",    muscles: [{ muscle: "Biceps", weight: 1.0 }] },
  // ── BACK ───────────────────────────────────────────────────────────────────
  { exercise_name: "Pull-Up",          muscles: [{ muscle: "Lats", weight: 1.0 }, { muscle: "Biceps", weight: 0.5 }, { muscle: "Rear Deltoid", weight: 0.5 }] },
  { exercise_name: "Chin-Up",          muscles: [{ muscle: "Lats", weight: 1.0 }, { muscle: "Biceps", weight: 1.0 }, { muscle: "Rear Deltoid", weight: 0.5 }] },
  { exercise_name: "Lat Pulldown",     muscles: [{ muscle: "Lats", weight: 1.0 }, { muscle: "Biceps", weight: 0.5 }, { muscle: "Rear Deltoid", weight: 0.5 }] },
  { exercise_name: "Seated Cable Row", muscles: [{ muscle: "Lats", weight: 1.0 }, { muscle: "Middle Trapezius", weight: 1.0 }, { muscle: "Biceps", weight: 0.5 }, { muscle: "Rear Deltoid", weight: 0.5 }] },
  { exercise_name: "Barbell Row",      muscles: [{ muscle: "Lats", weight: 1.0 }, { muscle: "Middle Trapezius", weight: 1.0 }, { muscle: "Biceps", weight: 0.5 }, { muscle: "Rear Deltoid", weight: 0.5 }] },
  { exercise_name: "Dumbbell Row",     muscles: [{ muscle: "Lats", weight: 1.0 }, { muscle: "Biceps", weight: 0.5 }, { muscle: "Rear Deltoid", weight: 0.5 }] },
  { exercise_name: "T-Bar Row",        muscles: [{ muscle: "Lats", weight: 1.0 }, { muscle: "Middle Trapezius", weight: 1.0 }, { muscle: "Biceps", weight: 0.5 }] },
  { exercise_name: "Deadlift",         muscles: [{ muscle: "Erector Spinae", weight: 1.0 }, { muscle: "Glutes", weight: 1.0 }, { muscle: "Hamstrings", weight: 0.5 }, { muscle: "Upper Trapezius", weight: 0.25 }, { muscle: "Lats", weight: 0.25 }] },
  { exercise_name: "Hyperextension",   muscles: [{ muscle: "Erector Spinae", weight: 1.0 }, { muscle: "Glutes", weight: 0.5 }, { muscle: "Hamstrings", weight: 0.5 }] },
  { exercise_name: "Shrug",            muscles: [{ muscle: "Upper Trapezius", weight: 1.0 }] },
  { exercise_name: "Upright Row",      muscles: [{ muscle: "Upper Trapezius", weight: 1.0 }, { muscle: "Middle Deltoid", weight: 1.0 }, { muscle: "Biceps", weight: 0.5 }] },
  // ── LEGS ───────────────────────────────────────────────────────────────────
  { exercise_name: "Squat",                 muscles: [{ muscle: "Quads", weight: 1.0 }, { muscle: "Glutes", weight: 1.0 }, { muscle: "Hamstrings", weight: 0.5 }, { muscle: "Erector Spinae", weight: 0.25 }] },
  { exercise_name: "Front Squat",           muscles: [{ muscle: "Quads", weight: 1.0 }, { muscle: "Glutes", weight: 0.5 }, { muscle: "Erector Spinae", weight: 0.5 }] },
  { exercise_name: "Leg Press",             muscles: [{ muscle: "Quads", weight: 1.0 }, { muscle: "Glutes", weight: 1.0 }, { muscle: "Hamstrings", weight: 0.5 }] },
  { exercise_name: "Hack Squat",            muscles: [{ muscle: "Quads", weight: 1.0 }, { muscle: "Glutes", weight: 0.5 }] },
  { exercise_name: "Lunge",                 muscles: [{ muscle: "Quads", weight: 1.0 }, { muscle: "Glutes", weight: 1.0 }, { muscle: "Hamstrings", weight: 0.5 }] },
  { exercise_name: "Bulgarian Split Squat", muscles: [{ muscle: "Quads", weight: 1.0 }, { muscle: "Glutes", weight: 1.0 }, { muscle: "Hamstrings", weight: 0.5 }] },
  { exercise_name: "Step-Up",               muscles: [{ muscle: "Quads", weight: 1.0 }, { muscle: "Glutes", weight: 1.0 }, { muscle: "Hamstrings", weight: 0.5 }] },
  { exercise_name: "Romanian Deadlift",     muscles: [{ muscle: "Hamstrings", weight: 1.0 }, { muscle: "Glutes", weight: 1.0 }, { muscle: "Erector Spinae", weight: 0.5 }] },
  { exercise_name: "Leg Curl",              muscles: [{ muscle: "Hamstrings", weight: 1.0 }] },
  { exercise_name: "Nordic Curl",           muscles: [{ muscle: "Hamstrings", weight: 1.0 }] },
  { exercise_name: "Leg Extension",         muscles: [{ muscle: "Quads", weight: 1.0 }] },
  { exercise_name: "Hip Thrust",            muscles: [{ muscle: "Glutes", weight: 1.0 }, { muscle: "Hamstrings", weight: 0.5 }] },
  { exercise_name: "Glute Bridge",          muscles: [{ muscle: "Glutes", weight: 1.0 }, { muscle: "Hamstrings", weight: 0.5 }] },
  { exercise_name: "Calf Raise",            muscles: [{ muscle: "Calves", weight: 1.0 }] },
  { exercise_name: "Seated Calf Raise",     muscles: [{ muscle: "Calves", weight: 1.0 }] },
  // ── CORE ───────────────────────────────────────────────────────────────────
  { exercise_name: "Plank",         muscles: [{ muscle: "Abs", weight: 1.0 }, { muscle: "Erector Spinae", weight: 0.5 }] },
  { exercise_name: "Crunch",        muscles: [{ muscle: "Abs", weight: 1.0 }] },
  { exercise_name: "Leg Raise",     muscles: [{ muscle: "Abs", weight: 1.0 }, { muscle: "Hip Flexors", weight: 0.5 }] },
  { exercise_name: "Cable Crunch",  muscles: [{ muscle: "Abs", weight: 1.0 }] },
  { exercise_name: "Russian Twist", muscles: [{ muscle: "Obliques", weight: 1.0 }, { muscle: "Abs", weight: 0.5 }] },
  { exercise_name: "Woodchop",      muscles: [{ muscle: "Obliques", weight: 1.0 }, { muscle: "Abs", weight: 0.5 }] },
];

export const EXERCISE_MAP = new Map<string, ExerciseMapping>(
  EXERCISE_MUSCLE_MAP.map((e) => [e.exercise_name.toLowerCase(), e])
);

export function lookupExercise(name: string): ExerciseMapping | undefined {
  return EXERCISE_MAP.get(name.toLowerCase().trim());
}
