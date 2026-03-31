import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Brain, ClipboardList, Plus, Trash2, Zap } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';
import type { FormAnalysisResult } from '@/src/services/geminiClient';

export type ExerciseEntry = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
};

type Props = {
  analyses: FormAnalysisResult[];
  exercises: ExerciseEntry[];
  onAddExercise: (entry: ExerciseEntry) => void;
  onRemoveExercise: (id: string) => void;
  onGoCoach: () => void;
};

function scoreColor(score: number) {
  if (score >= 75) return '#2a7a4b';
  if (score >= 50) return '#b86a10';
  return '#c03131';
}

function formatDetails(e: ExerciseEntry): string {
  const parts: string[] = [];
  if (e.sets) parts.push(`${e.sets} sets`);
  if (e.reps) parts.push(`${e.reps} reps`);
  if (e.weight) parts.push(`${e.weight} kg`);
  return parts.join(' × ');
}

export function WorkoutLogPage({ analyses, exercises, onAddExercise, onRemoveExercise, onGoCoach }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddExercise({ id: Date.now().toString(), name: name.trim(), sets, reps, weight });
    setName('');
    setSets('');
    setReps('');
    setWeight('');
    setShowForm(false);
  };

  const exerciseGroups = analyses.reduce<Record<string, FormAnalysisResult[]>>((acc, a) => {
    if (!acc[a.exercise]) acc[a.exercise] = [];
    acc[a.exercise].push(a);
    return acc;
  }, {});

  return (
    <View style={styles.pageStack}>
      {/* Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <ClipboardList size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>Workout Log</Text>
        </View>
        <Text style={styles.heroTitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
        <Text style={styles.heroSubtitle}>Log today's exercises and review your form history.</Text>
      </View>

      {/* Session card */}
      <GlassCard title="Today's Session" icon={ClipboardList}>
        {exercises.length === 0 && !showForm ? (
          <Text style={local.emptySession}>No exercises added yet. Tap below to start logging.</Text>
        ) : null}

        {/* Exercise list */}
        {exercises.map((ex) => (
          <View key={ex.id} style={local.exerciseRow}>
            <View style={local.exerciseInfo}>
              <Text style={local.exerciseName}>{ex.name}</Text>
              {formatDetails(ex) ? (
                <Text style={local.exerciseDetails}>{formatDetails(ex)}</Text>
              ) : null}
            </View>
            <Pressable onPress={() => onRemoveExercise(ex.id)} style={local.removeBtn} hitSlop={8}>
              <Trash2 size={14} color="#b0c0d4" />
            </Pressable>
          </View>
        ))}

        {/* Inline add form */}
        {showForm ? (
          <View style={local.addForm}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Exercise name (e.g. Squat)"
              placeholderTextColor="#89a3bf"
              style={[styles.authInput, local.nameInput]}
              autoFocus
              returnKeyType="next"
            />
            <View style={local.detailRow}>
              <TextInput
                value={sets}
                onChangeText={setSets}
                placeholder="Sets"
                placeholderTextColor="#89a3bf"
                style={[styles.authInput, local.detailInput]}
                keyboardType="numeric"
              />
              <TextInput
                value={reps}
                onChangeText={setReps}
                placeholder="Reps"
                placeholderTextColor="#89a3bf"
                style={[styles.authInput, local.detailInput]}
                keyboardType="numeric"
              />
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="kg"
                placeholderTextColor="#89a3bf"
                style={[styles.authInput, local.detailInput]}
                keyboardType="numeric"
              />
            </View>
            <View style={local.formActions}>
              <Pressable style={[styles.primaryButton, local.confirmBtn]} onPress={handleAdd}>
                <Text style={styles.primaryButtonText}>Add</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, local.cancelFormBtn]} onPress={() => { setShowForm(false); setName(''); setSets(''); setReps(''); setWeight(''); }}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={local.addExerciseBtn} onPress={() => setShowForm(true)}>
            <Plus size={16} color="#4f7fb2" />
            <Text style={local.addExerciseBtnText}>Add Exercise</Text>
          </Pressable>
        )}
      </GlassCard>

      {/* Form Analysis History */}
      {analyses.length > 0 ? (
        <GlassCard title={`Form History (${analyses.length})`} icon={Zap}>
          {Object.entries(exerciseGroups).map(([exercise, sessions]) => {
            const best = Math.max(...sessions.map((s) => s.overall_score));
            const trend =
              sessions.length > 1
                ? sessions[sessions.length - 1].overall_score - sessions[sessions.length - 2].overall_score
                : null;
            return (
              <View key={exercise} style={local.historyGroup}>
                <View style={local.historyGroupHeader}>
                  <Text style={local.historyGroupName}>{exercise}</Text>
                  <View style={local.historyGroupRight}>
                    <Text style={[local.bestScore, { color: scoreColor(best) }]}>{best}</Text>
                    <Text style={local.bestLabel}> best</Text>
                    {trend !== null ? (
                      <Text style={[local.trend, { color: trend >= 0 ? '#2a7a4b' : '#c03131' }]}>
                        {trend >= 0 ? '  ▲' : '  ▼'}{Math.abs(trend)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {[...sessions].reverse().map((s) => (
                  <View key={s.id} style={local.historyRow}>
                    <View style={[local.historyBadge, { backgroundColor: scoreColor(s.overall_score) + '22' }]}>
                      <Text style={[local.historyScore, { color: scoreColor(s.overall_score) }]}>{s.overall_score}</Text>
                    </View>
                    <View style={local.historyRowInfo}>
                      <Text style={local.historyDate}>
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {s.rep_count > 0 ? ` · ${s.rep_count} reps` : ''}
                        {' · '}{Math.round(s.confidence * 100)}% confidence
                      </Text>
                      {s.form_issues.length > 0 ? (
                        <Text style={local.historyIssues}>
                          {s.form_issues.filter((i) => i.severity === 'critical').length > 0
                            ? `${s.form_issues.filter((i) => i.severity === 'critical').length} critical · `
                            : ''}
                          {s.form_issues.length} issue{s.form_issues.length !== 1 ? 's' : ''}
                        </Text>
                      ) : (
                        <Text style={local.historyGood}>No issues</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </GlassCard>
      ) : (
        <GlassCard title="Form Analysis" icon={Zap}>
          <Text style={local.emptyAnalysis}>Record a set in the Coach tab to get AI form feedback linked to your workout.</Text>
          <Pressable style={local.goCoachBtn} onPress={onGoCoach}>
            <Zap size={14} color="#4f7fb2" />
            <Text style={local.goCoachText}>Go to AI Coach</Text>
          </Pressable>
        </GlassCard>
      )}

      <GlassCard title="Analytics (Coming Soon)" icon={Brain}>
        <InfoRow label="PR Detection" value="Automatically track personal records per exercise." />
        <InfoRow label="Weekly Volume" value="Total sets per muscle group over time." />
        <InfoRow label="Plateau Flags" value="Detect stalled progress and suggest adjustments." />
      </GlassCard>
    </View>
  );
}

const local = StyleSheet.create({
  emptySession: {
    color: '#7a94ae',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 6,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(171,203,236,0.3)',
    gap: 10,
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    color: '#1f2e40',
    fontWeight: '700',
    fontSize: 15,
  },
  exerciseDetails: {
    color: '#5878a3',
    fontSize: 12,
  },
  removeBtn: {
    padding: 4,
  },
  addForm: {
    gap: 10,
    paddingTop: 6,
  },
  nameInput: {
    fontSize: 15,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmBtn: {
    flex: 1,
  },
  cancelFormBtn: {
    flex: 1,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cee1f5',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(237,247,255,0.5)',
    marginTop: 4,
  },
  addExerciseBtnText: {
    color: '#4f7fb2',
    fontWeight: '700',
    fontSize: 14,
  },
  historyGroup: {
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(171,203,236,0.25)',
    marginBottom: 4,
  },
  historyGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyGroupName: {
    color: '#22364d',
    fontWeight: '800',
    fontSize: 14,
  },
  historyGroupRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bestScore: {
    fontWeight: '900',
    fontSize: 16,
  },
  bestLabel: {
    color: '#8fa8c0',
    fontSize: 12,
  },
  trend: {
    fontWeight: '700',
    fontSize: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
  },
  historyBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyScore: {
    fontWeight: '900',
    fontSize: 16,
  },
  historyRowInfo: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    color: '#445d78',
    fontSize: 12,
    fontWeight: '600',
  },
  historyIssues: {
    color: '#b86a10',
    fontSize: 11,
    fontWeight: '600',
  },
  historyGood: {
    color: '#2a7a4b',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyAnalysis: {
    color: '#6a83a0',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  goCoachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cee1f5',
    backgroundColor: 'rgba(237,247,255,0.78)',
  },
  goCoachText: {
    color: '#4f7fb2',
    fontWeight: '700',
    fontSize: 14,
  },
});
