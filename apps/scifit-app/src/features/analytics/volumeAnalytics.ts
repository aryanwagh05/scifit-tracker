// volumeAnalytics.ts
import type { SetEntry, MuscleGroup, MuscleVolumeResult, VolumeStatus } from "./types";
import { lookupExercise } from "./exerciseMuscleMap";

export type { MuscleVolumeResult, VolumeStatus };

// ── Volume Thresholds (from analytics_spec.md Section 2) ───────────────────

const VOLUME_THRESHOLDS: Record<MuscleGroup, { tooLittle: number; optMin: number; optMax: number; tooMuch: number }> = {
  "Chest":            { tooLittle: 8,  optMin: 10, optMax: 20, tooMuch: 22 },
  "Front Deltoid":    { tooLittle: 4,  optMin: 6,  optMax: 14, tooMuch: 16 },
  "Middle Deltoid":   { tooLittle: 6,  optMin: 8,  optMax: 16, tooMuch: 18 },
  "Rear Deltoid":     { tooLittle: 6,  optMin: 8,  optMax: 16, tooMuch: 18 },
  "Triceps":          { tooLittle: 6,  optMin: 8,  optMax: 18, tooMuch: 20 },
  "Biceps":           { tooLittle: 6,  optMin: 8,  optMax: 18, tooMuch: 20 },
  "Brachialis":       { tooLittle: 4,  optMin: 6,  optMax: 14, tooMuch: 16 },
  "Forearms":         { tooLittle: 4,  optMin: 6,  optMax: 14, tooMuch: 16 },
  "Lats":             { tooLittle: 8,  optMin: 10, optMax: 20, tooMuch: 22 },
  "Middle Trapezius": { tooLittle: 6,  optMin: 8,  optMax: 16, tooMuch: 18 },
  "Upper Trapezius":  { tooLittle: 4,  optMin: 5,  optMax: 12, tooMuch: 14 },
  "Erector Spinae":   { tooLittle: 6,  optMin: 8,  optMax: 16, tooMuch: 18 },
  "Quads":            { tooLittle: 8,  optMin: 10, optMax: 20, tooMuch: 22 },
  "Hamstrings":       { tooLittle: 6,  optMin: 8,  optMax: 16, tooMuch: 18 },
  "Glutes":           { tooLittle: 6,  optMin: 8,  optMax: 16, tooMuch: 18 },
  "Calves":           { tooLittle: 8,  optMin: 10, optMax: 20, tooMuch: 22 },
  "Abs":              { tooLittle: 6,  optMin: 8,  optMax: 16, tooMuch: 18 },
  "Obliques":         { tooLittle: 4,  optMin: 6,  optMax: 12, tooMuch: 14 },
  "Hip Flexors":      { tooLittle: 4,  optMin: 6,  optMax: 12, tooMuch: 14 },
  "Rotator Cuff":     { tooLittle: 4,  optMin: 6,  optMax: 12, tooMuch: 14 },
};

// ── Helpers ────────────────────────────────────────────────────────────────

export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function classifyStatus(
  sets: number,
  t: { tooLittle: number; optMin: number; optMax: number; tooMuch: number }
): VolumeStatus {
  if (sets > t.tooMuch)      return "OVERTRAINED";
  if (sets >= t.optMin)      return "OPTIMAL";
  if (sets >= t.optMin - 2)  return "APPROACHING";
  return "UNDERTRAINED";
}

// ── Main Functions ─────────────────────────────────────────────────────────

export function computeWeeklyVolume(
  sets: SetEntry[],
  weekOf?: string
): MuscleVolumeResult[] {
  const targetWeekStart = getWeekStart(weekOf ?? new Date().toISOString().slice(0, 10));
  const weeklySets = sets.filter((s) => getWeekStart(s.date) === targetWeekStart);

  const volumeMap = new Map<MuscleGroup, number>();
  for (const set of weeklySets) {
    const mapping = lookupExercise(set.exercise_name);
    if (!mapping) continue;
    for (const { muscle, weight } of mapping.muscles) {
      volumeMap.set(muscle, (volumeMap.get(muscle) ?? 0) + weight);
    }
  }

  const ORDER: Record<VolumeStatus, number> = { OVERTRAINED: 0, UNDERTRAINED: 1, APPROACHING: 2, OPTIMAL: 3 };
  const results: MuscleVolumeResult[] = (Object.entries(VOLUME_THRESHOLDS) as [MuscleGroup, typeof VOLUME_THRESHOLDS[MuscleGroup]][])
    .map(([muscle, t]) => {
      const weekly_sets = parseFloat((volumeMap.get(muscle) ?? 0).toFixed(2));
      return {
        muscle,
        weekly_sets,
        status: classifyStatus(weekly_sets, t),
        too_little_threshold: t.tooLittle,
        optimal_min: t.optMin,
        optimal_max: t.optMax,
        too_much_threshold: t.tooMuch,
      };
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.weekly_sets - a.weekly_sets);

  return results;
}

export function getVolumeAlerts(sets: SetEntry[], weekOf?: string): MuscleVolumeResult[] {
  return computeWeeklyVolume(sets, weekOf).filter((r) => r.status !== "OPTIMAL");
}
