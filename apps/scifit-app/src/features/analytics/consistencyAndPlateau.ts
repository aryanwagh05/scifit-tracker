// consistencyAndPlateau.ts
import type { SetEntry, WorkoutSession, ConsistencyResult, ConsistencyTier, PlateauResult, PlateauSeverity } from "./types";
import { estimateOneRM } from "./prDetection";

export type { ConsistencyResult, ConsistencyTier, PlateauResult, PlateauSeverity };

// ── Helpers ────────────────────────────────────────────────────────────────

export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addWeeks(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

function dateDiffDays(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

// ── Consistency ────────────────────────────────────────────────────────────

export function computeConsistency(
  sessions: WorkoutSession[],
  daysPerWeek: number,
  referenceDate?: string
): ConsistencyResult {
  const today = referenceDate ?? new Date().toISOString().slice(0, 10);
  const windowStart = new Date(today);
  windowStart.setUTCDate(windowStart.getUTCDate() - 27);
  const windowStartStr = windowStart.toISOString().slice(0, 10);

  const distinctDays = new Set(
    sessions.filter((s) => s.date >= windowStartStr && s.date <= today).map((s) => s.date)
  );
  const actual_days = distinctDays.size;
  const target_days = daysPerWeek * 4;
  const score = parseFloat(((actual_days / target_days) * 100).toFixed(1));

  let tier: ConsistencyTier;
  let label: string;
  if (score >= 90)      { tier = "ELITE";        label = "On Fire 🔥"; }
  else if (score >= 75) { tier = "CONSISTENT";   label = "On Track ✅"; }
  else if (score >= 50) { tier = "MODERATE";     label = "Could Be Better ⚠️"; }
  else                  { tier = "INCONSISTENT"; label = "Needs Improvement ❌"; }

  // Current streak (consecutive weeks meeting goal, walking backwards)
  const weekMap = new Map<string, number>();
  for (const s of sessions) {
    const ws = getWeekStart(s.date);
    weekMap.set(ws, (weekMap.get(ws) ?? 0) + 1);
  }

  const thisWeekStart = getWeekStart(today);
  let current_streak_weeks = 0;
  let w = thisWeekStart;
  while (true) {
    if ((weekMap.get(w) ?? 0) < daysPerWeek) break;
    current_streak_weeks++;
    w = addWeeks(w, -1);
    if (dateDiffDays(w, thisWeekStart) > 730) break;
  }

  // Longest streak
  const allWeeks = Array.from(weekMap.keys()).sort();
  let longest_streak_weeks = 0;
  let runningStreak = 0;
  for (let i = 0; i < allWeeks.length; i++) {
    if ((weekMap.get(allWeeks[i]) ?? 0) >= daysPerWeek) {
      runningStreak = (i > 0 && dateDiffDays(allWeeks[i - 1], allWeeks[i]) <= 7) ? runningStreak + 1 : 1;
      longest_streak_weeks = Math.max(longest_streak_weeks, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  return { score, tier, label, actual_days, target_days, current_streak_weeks, longest_streak_weeks };
}

// ── Plateau Detection ──────────────────────────────────────────────────────

export function detectPlateau(
  sets: SetEntry[],
  exerciseName: string,
  userGoal: string = "",
  referenceDate?: string
): PlateauResult | null {
  const today = referenceDate ?? new Date().toISOString().slice(0, 10);
  const exercise = exerciseName.toLowerCase().trim();

  if (userGoal.toLowerCase().includes("lose weight")) return null;

  const relevant = sets.filter((s) => s.exercise_name.toLowerCase().trim() === exercise);
  if (relevant.length === 0) return null;

  const earliest = relevant.reduce((a, b) => (a.date < b.date ? a : b)).date;
  if (dateDiffDays(earliest, today) < 28) return null;

  const weekBest1RM = new Map<string, number>();
  const weekHasSets = new Map<string, boolean>();
  for (const s of relevant) {
    const ws = getWeekStart(s.date);
    const e1rm = estimateOneRM(s.weight, s.reps);
    if (e1rm !== null) weekBest1RM.set(ws, Math.max(weekBest1RM.get(ws) ?? 0, e1rm));
    weekHasSets.set(ws, true);
  }

  // Find last 3 weeks with data
  const recentWeeks: string[] = [];
  let wk = getWeekStart(today);
  while (recentWeeks.length < 3) {
    if (weekHasSets.has(wk)) recentWeeks.unshift(wk);
    wk = addWeeks(wk, -1);
    if (dateDiffDays(wk, today) > 180) break;
  }
  if (recentWeeks.length < 3) return null;

  const week1_1rm = weekBest1RM.get(recentWeeks[0]) ?? 0;
  const week3_1rm = weekBest1RM.get(recentWeeks[2]) ?? 0;
  if (week1_1rm === 0 || week3_1rm === 0) return null;
  if ((week3_1rm - week1_1rm) / week1_1rm >= 0.02) return null;

  // Count stalled weeks
  let weeks_stalled = 3;
  let lookback = addWeeks(recentWeeks[0], -1);
  while (weeks_stalled < 12) {
    if (!weekHasSets.has(lookback)) break;
    const prev = weekBest1RM.get(lookback) ?? 0;
    if (prev === 0 || (week3_1rm - prev) / prev >= 0.02) break;
    weeks_stalled++;
    lookback = addWeeks(lookback, -1);
  }

  let severity: PlateauSeverity;
  let suggestion: string;
  if (weeks_stalled >= 8)      { severity = "SEVERE";   suggestion = "Consider switching your program or periodization scheme"; }
  else if (weeks_stalled >= 5) { severity = "MODERATE"; suggestion = "Schedule a deload week, then return with adjusted intensity"; }
  else                         { severity = "MILD";     suggestion = "Try varying rep ranges (e.g., shift from 3×8 to 5×5 or 3×12)"; }

  return { exercise_name: exerciseName, severity, weeks_stalled, suggestion,
    week1_1rm: parseFloat(week1_1rm.toFixed(2)), week3_1rm: parseFloat(week3_1rm.toFixed(2)) };
}
