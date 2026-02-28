# SciFit Analytics Specification

**Author:** Oliver  
**Last Updated:** 2026-02-18  
**Purpose:** Define analytics logic for volume tracking, exercise-to-muscle mapping, PR detection, consistency scoring, and plateau detection.

---

## 1. Exercise → Muscle Group Mapping

> Volume for a muscle group is computed as:  
> **Volume = sets × reps × weight (kg)**  
> Primary muscles receive **100%** of the volume. Secondary muscles receive **50%** by default.
>
> **Note on compound movements:** For exercises with many secondary muscles (e.g., Deadlift has Hamstrings, Traps, Lats as secondary), applying a flat 0.5 weight to all of them may cause these muscles to appear over-trained in the dashboard. In MVP, we keep 0.5 for simplicity. Post-MVP, consider tiered secondary weights (e.g., 0.5 for the dominant secondary, 0.25 for incidental secondaries) based on how much the movement actually stresses each group.

| exercise_name | primary_muscles | secondary_muscles |
|---|---|---|
| Bench Press | Chest | Triceps, Front Deltoid |
| Incline Bench Press | Chest, Front Deltoid | Triceps |
| Decline Bench Press | Chest | Triceps |
| Dumbbell Fly | Chest | Front Deltoid |
| Cable Crossover | Chest | Front Deltoid |
| Push-Up | Chest | Triceps, Front Deltoid |
| Overhead Press | Front Deltoid, Middle Deltoid | Triceps, Upper Chest |
| Arnold Press | Front Deltoid, Middle Deltoid | Triceps |
| Lateral Raise | Middle Deltoid | — |
| Front Raise | Front Deltoid | — |
| Rear Delt Fly | Rear Deltoid | Middle Trapezius |
| Face Pull | Rear Deltoid | Rotator Cuff |
| Triceps Pushdown | Triceps | — |
| Skull Crusher | Triceps | — |
| Close-Grip Bench Press | Triceps | Chest |
| Overhead Triceps Extension | Triceps | — |
| Dip | Triceps, Chest | Front Deltoid |
| Barbell Curl | Biceps | Brachialis |
| Dumbbell Curl | Biceps | Brachialis |
| Hammer Curl | Brachialis, Biceps | Forearms |
| Preacher Curl | Biceps | — |
| Cable Curl | Biceps | — |
| Pull-Up | Lats | Biceps, Rear Deltoid |
| Chin-Up | Lats, Biceps | Rear Deltoid |
| Lat Pulldown | Lats | Biceps, Rear Deltoid |
| Seated Cable Row | Lats, Middle Trapezius | Biceps, Rear Deltoid |
| Barbell Row | Lats, Middle Trapezius | Biceps, Rear Deltoid |
| Dumbbell Row | Lats | Biceps, Rear Deltoid |
| T-Bar Row | Lats, Middle Trapezius | Biceps |
| Deadlift | Erector Spinae, Glutes | Hamstrings, Traps, Lats |
| Hyperextension | Erector Spinae | Glutes, Hamstrings |
| Shrug | Upper Trapezius | — |
| Upright Row | Upper Trapezius, Middle Deltoid | Biceps |
| Squat | Quads, Glutes | Hamstrings, Erector Spinae |
| Front Squat | Quads | Glutes, Erector Spinae |
| Leg Press | Quads, Glutes | Hamstrings |
| Hack Squat | Quads | Glutes |
| Lunge | Quads, Glutes | Hamstrings |
| Bulgarian Split Squat | Quads, Glutes | Hamstrings |
| Step-Up | Quads, Glutes | Hamstrings |
| Romanian Deadlift | Hamstrings, Glutes | Erector Spinae |
| Leg Curl | Hamstrings | — |
| Nordic Curl | Hamstrings | — |
| Leg Extension | Quads | — |
| Hip Thrust | Glutes | Hamstrings |
| Glute Bridge | Glutes | Hamstrings |
| Calf Raise | Calves | — |
| Seated Calf Raise | Calves | — |
| Plank | Abs | Erector Spinae |
| Crunch | Abs | — |
| Leg Raise | Abs | Hip Flexors |
| Cable Crunch | Abs | — |
| Russian Twist | Obliques, Abs | — |
| Woodchop | Obliques | Abs |

---

## 2. Weekly Volume Recommendations per Muscle Group

> **Unit:** Total sets per week (each set counts as 1 regardless of reps/weight — this is the industry-standard "set volume" metric used in hypertrophy research).  
> Secondary muscle contributions count as **0.5 sets** toward that muscle's weekly total.

| Muscle Group | Too Little (sets/week) | Optimal Range (sets/week) | Too Much (sets/week) |
|---|---|---|---|
| Chest | < 8 | 10 – 20 | > 22 |
| Front Deltoid | < 4 | 6 – 14 | > 16 |
| Middle Deltoid | < 6 | 8 – 16 | > 18 |
| Rear Deltoid | < 6 | 8 – 16 | > 18 |
| Triceps | < 6 | 8 – 18 | > 20 |
| Biceps | < 6 | 8 – 18 | > 20 |
| Brachialis / Forearms | < 4 | 6 – 14 | > 16 |
| Lats | < 8 | 10 – 20 | > 22 |
| Middle Trapezius | < 6 | 8 – 16 | > 18 |
| Upper Trapezius | < 4 | 5 – 12 | > 14 |
| Erector Spinae | < 6 | 8 – 16 | > 18 |
| Quads | < 8 | 10 – 20 | > 22 |
| Hamstrings | < 6 | 8 – 16 | > 18 |
| Glutes | < 6 | 8 – 16 | > 18 |
| Calves | < 8 | 10 – 20 | > 22 |
| Abs | < 6 | 8 – 16 | > 18 |
| Obliques | < 4 | 6 – 12 | > 14 |

> **References:** Schoenfeld & Grgic (2019), israetel's MRV/MEV guidelines (Renaissance Periodization).

### Volume Status Labels

| Condition | Label | UI Indicator |
|---|---|---|
| sets < Too Little threshold | `UNDERTRAINED` | 🔵 Blue |
| sets in Optimal Range | `OPTIMAL` | 🟢 Green |
| sets > Too Much threshold | `OVERTRAINED` | 🔴 Red |
| sets slightly below optimal (within 2 sets) | `APPROACHING` | 🟡 Yellow |

---

## 3. Key Metric Definitions

### 3.1 Personal Record (PR)

A **PR** is logged when the user achieves a new maximum for a given exercise in any of the following categories:

| PR Type | Definition | Trigger Condition |
|---|---|---|
| **Weight PR** | Heaviest load ever lifted for ≥ 1 rep on this exercise | `weight > max(weight) for this exercise across all history` |
| **Volume PR** | Highest single-session total volume for this exercise | `session_volume > max(session_volume) for this exercise` |
| **Rep PR** | Most reps ever completed at a given weight | `reps > max(reps) WHERE weight = current_weight for this exercise` |
| **1RM Estimated PR** | Highest estimated 1-rep max (Epley formula) | `estimated_1rm > max(estimated_1rm) for this exercise` |

**Epley Formula:**  
```
estimated_1rm = weight × (1 + reps / 30)
```

> **Constraint:** Only calculate `estimated_1rm` when `reps ≤ 12`. The Epley formula is reasonably accurate in the 1–12 rep range but significantly overestimates 1RM for higher-rep sets (15+). Sets with `reps > 12` should be excluded from 1RM PR comparison to avoid false PRs triggered by light-weight endurance work.

> A PR notification should fire **at end of session** after all sets are logged, not mid-session.

---

### 3.2 Consistency

**Consistency Score** measures how reliably the user trains relative to their stated `days_per_week` goal from their profile.

#### Calculation Window: Rolling 4-Week Period

```
consistency_score = (actual_training_days / target_training_days) × 100
```

Where:
- `target_training_days = days_per_week × 4`
- `actual_training_days` = count of distinct dates with at least 1 workout logged in the past 28 days

#### Consistency Tiers

| Score | Tier | Label |
|---|---|---|
| ≥ 90% | 🏆 Elite | "On Fire" |
| 75% – 89% | ✅ Consistent | "On Track" |
| 50% – 74% | ⚠️ Moderate | "Could Be Better" |
| < 50% | ❌ Inconsistent | "Needs Improvement" |

#### Streak Tracking

A **streak** is a consecutive sequence of weeks where the user hit ≥ `days_per_week` goal.

- Week starts Monday 00:00 UTC.
- Streak resets if the user completes fewer sessions than `days_per_week` in any calendar week.
- Current streak and longest streak are both stored/displayed.

---

### 3.3 Plateau Detection

A **plateau** is detected when meaningful progress has stalled on a given exercise over a defined observation window.

#### Detection Window: Last 3 Weeks of Training Data for an Exercise

For each exercise, compute weekly best `estimated_1rm` (Epley). A plateau is flagged when:

```
|estimated_1rm_week3 - estimated_1rm_week1| / estimated_1rm_week1 < 0.02
```

i.e., less than **2% improvement** over 3 weeks, with the exercise logged **consistently** (at least once per week) across all 3 weeks.

#### Plateau Severity Tiers

| Duration of Stall | Severity | Suggested Action |
|---|---|---|
| 3 weeks | `MILD` | "Try varying rep ranges" |
| 5 weeks | `MODERATE` | "Consider a deload week" |
| 8+ weeks | `SEVERE` | "Recommend program change" |

#### Exclusions (do NOT flag plateau if):
- User logged fewer than **1 session/week** for this exercise in any of the 3 weeks (insufficient data — at least one session per week is required for a valid plateau signal)
- User is in a **cut phase** (if goal = `"lose weight"` in profile) — weight loss can suppress strength gains
- Exercise was first logged < 4 weeks ago (too new to plateau)

---

## 4. Volume Counting Logic (Implementation Notes)

When a user logs a set for an exercise (e.g., "Bench Press"):

```
Chest volume    += 1.0 set  (primary)
Triceps volume  += 0.5 set  (secondary)
Front Deltoid   += 0.5 set  (secondary)
```

Weekly volume is aggregated by the **ISO week** (Monday–Sunday) of the `date` field in the `sets` table, joined via `workouts`.

```sql
-- Example query: weekly set volume per muscle group for a user
SELECT
  muscle_group,
  DATE_TRUNC('week', w.date) AS week_start,
  SUM(contribution) AS weekly_sets
FROM sets s
JOIN workouts w ON s.workout_id = w.id
JOIN exercise_muscle_map emm ON s.exercise_name = emm.exercise_name
WHERE w.user_id = :user_id
GROUP BY muscle_group, week_start
ORDER BY week_start DESC;
```

> `exercise_muscle_map` will be a lookup table (or JSON config) derived from Section 1.

---

## 5. Open Questions / Future Scope

- Should we support custom/user-defined exercises? If so, need manual muscle tagging UI.
- Nutrition integration: correlate protein intake (from `nutrition_logs`) with muscle recovery recommendations.
- RPE trend analysis: flag exercises where RPE is rising but weight/reps are flat (early plateau signal).
- Personalization: adjust volume thresholds based on `experience_level` from profiles table (beginner vs advanced have different MRV).
