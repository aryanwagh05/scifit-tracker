// prDetection.ts
import type { SetEntry, PRResult, PRType } from "./types";

export type { PRResult, PRType };

export function estimateOneRM(weight: number, reps: number): number | null {
  if (reps > 12 || reps < 1) return null;
  return parseFloat((weight * (1 + reps / 30)).toFixed(2));
}

function groupByDate(sets: SetEntry[]): Map<string, SetEntry[]> {
  const map = new Map<string, SetEntry[]>();
  for (const s of sets) {
    if (!map.has(s.date)) map.set(s.date, []);
    map.get(s.date)!.push(s);
  }
  return map;
}

export function detectPRs(
  allSets: SetEntry[],
  exerciseName: string,
  sessionDate: string
): PRResult[] {
  const exercise = exerciseName.toLowerCase().trim();
  const relevant = allSets.filter((s) => s.exercise_name.toLowerCase().trim() === exercise);
  const history = relevant.filter((s) => s.date < sessionDate);
  const todaySets = relevant.filter((s) => s.date === sessionDate);
  if (todaySets.length === 0) return [];

  const prs: PRResult[] = [];

  // 1. Weight PR
  const todayMaxWeight = Math.max(...todaySets.map((s) => s.weight));
  const histMaxWeight = history.length > 0 ? Math.max(...history.map((s) => s.weight)) : null;
  if (histMaxWeight === null || todayMaxWeight > histMaxWeight) {
    prs.push({ exercise_name: exerciseName, pr_type: "WEIGHT", new_value: todayMaxWeight, previous_best: histMaxWeight, date: sessionDate,
      label: `New weight PR: ${todayMaxWeight} kg${histMaxWeight ? ` (was ${histMaxWeight} kg)` : " (first time!)"}` });
  }

  // 2. Session Volume PR
  const sessionVol = (s: SetEntry[]) => s.reduce((sum, x) => sum + x.reps * x.weight, 0);
  const todayVolume = parseFloat(sessionVol(todaySets).toFixed(2));
  const histMaxVolume = history.length > 0
    ? Math.max(...Array.from(groupByDate(history).values()).map((s) => parseFloat(sessionVol(s).toFixed(2))))
    : null;
  if (histMaxVolume === null || todayVolume > histMaxVolume) {
    prs.push({ exercise_name: exerciseName, pr_type: "VOLUME", new_value: todayVolume, previous_best: histMaxVolume, date: sessionDate,
      label: `New volume PR: ${todayVolume} kg·reps${histMaxVolume ? ` (was ${histMaxVolume})` : " (first time!)"}` });
  }

  // 3. Reps-at-Weight PR
  const weightGroups = new Map<number, number[]>();
  for (const s of todaySets) {
    if (!weightGroups.has(s.weight)) weightGroups.set(s.weight, []);
    weightGroups.get(s.weight)!.push(s.reps);
  }
  for (const [weight, repsList] of weightGroups) {
    const todayMaxReps = Math.max(...repsList);
    const histReps = history.filter((s) => s.weight === weight).map((s) => s.reps);
    const histMaxReps = histReps.length > 0 ? Math.max(...histReps) : null;
    if (histMaxReps === null || todayMaxReps > histMaxReps) {
      prs.push({ exercise_name: exerciseName, pr_type: "REPS_AT_WEIGHT", new_value: todayMaxReps, previous_best: histMaxReps, date: sessionDate,
        label: `New rep PR at ${weight} kg: ${todayMaxReps} reps${histMaxReps ? ` (was ${histMaxReps})` : " (first time at this weight!)"}` });
    }
  }

  // 4. Estimated 1RM PR
  const today1RMs = todaySets.map((s) => estimateOneRM(s.weight, s.reps)).filter((v): v is number => v !== null);
  const todayMax1RM = today1RMs.length > 0 ? Math.max(...today1RMs) : null;
  const hist1RMs = history.map((s) => estimateOneRM(s.weight, s.reps)).filter((v): v is number => v !== null);
  const histMax1RM = hist1RMs.length > 0 ? Math.max(...hist1RMs) : null;
  if (todayMax1RM !== null && (histMax1RM === null || todayMax1RM > histMax1RM)) {
    prs.push({ exercise_name: exerciseName, pr_type: "ESTIMATED_1RM", new_value: todayMax1RM, previous_best: histMax1RM, date: sessionDate,
      label: `New estimated 1RM PR: ${todayMax1RM} kg${histMax1RM ? ` (was ${histMax1RM} kg)` : " (first time!)"}` });
  }

  return prs;
}
