import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { Card } from 'tamagui';
import { Brain, Camera, ClipboardList } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';
import { StickFigureDemo } from './StickFigureDemo';

export function AICoachPage({
  selectedExercise,
  setSelectedExercise,
  coachSessionActive,
  cameraPermissionGranted,
  onRequestCameraPermission,
  onStartSession,
  onStopSession,
  onOpenGuide
}: {
  selectedExercise: string;
  setSelectedExercise: (value: string) => void;
  coachSessionActive: boolean;
  cameraPermissionGranted: boolean;
  onRequestCameraPermission: () => Promise<boolean>;
  onStartSession: () => Promise<boolean>;
  onStopSession: () => void;
  onOpenGuide: () => void;
}) {
  const exercises = ['Back Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row'];
  const [countdown, setCountdown] = useState(5);
  const [showDemo, setShowDemo] = useState(false);
  const [tick, setTick] = useState(0);

  const mockAiResult = {
    exercise: selectedExercise,
    rep_count: selectedExercise === 'Deadlift' ? 4 : 6,
    form_score: selectedExercise === 'Overhead Press' ? 0.81 : 0.88,
    confidence: 0.92,
    issues:
      selectedExercise === 'Back Squat'
        ? ['Knees cave in slightly on rep 4', 'Depth inconsistent by ~6cm']
        : ['Tempo slows in final reps', 'Torso drift detected'],
    cues:
      selectedExercise === 'Back Squat'
        ? ['Push knees out', 'Brace before descent']
        : ['Keep bar close to centerline', 'Control eccentric']
  };

  useEffect(() => {
    if (!coachSessionActive) {
      setCountdown(5);
      setShowDemo(false);
      setTick(0);
      return;
    }

    setCountdown(5);
    setShowDemo(false);
    setTick(0);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowDemo(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [coachSessionActive, selectedExercise]);

  useEffect(() => {
    if (!showDemo) return;
    const id = setInterval(() => setTick((prev) => prev + 1), 120);
    return () => clearInterval(id);
  }, [showDemo]);

  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Camera size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>AI Trainer Coach</Text>
        </View>
        <Text style={styles.heroTitle}>Form Feedback Flow</Text>
        <Text style={styles.heroSubtitle}>Select an exercise and simulate starting a camera coaching session.</Text>
      </Card>

      <GlassCard title="Select Exercise" icon={ClipboardList}>
        <View style={styles.exerciseChipWrap}>
          {exercises.map((exercise) => (
            <Pressable
              key={exercise}
              style={[styles.exerciseChip, selectedExercise === exercise && styles.exerciseChipActive]}
              onPress={() => setSelectedExercise(exercise)}
            >
              <Text style={[styles.exerciseChipText, selectedExercise === exercise && styles.exerciseChipTextActive]}>
                {exercise}
              </Text>
            </Pressable>
          ))}
        </View>

        {!cameraPermissionGranted ? (
          <Pressable style={styles.secondaryButton} onPress={onRequestCameraPermission}>
            <Text style={styles.secondaryButtonText}>Grant Camera Permission</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.primaryButton}
          onPress={async () => {
            await onStartSession();
          }}
        >
          <Text style={styles.primaryButtonText}>Start Workout ({selectedExercise})</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onOpenGuide}>
          <Text style={styles.secondaryButtonText}>View Camera Pipeline Guide</Text>
        </Pressable>
      </GlassCard>

      <GlassCard title="Session Status" icon={Brain}>
        {coachSessionActive ? (
          <>
            <InfoRow label="Status" value="Camera session simulated: ACTIVE" />
            <InfoRow label="Exercise" value={selectedExercise} />
            <InfoRow label="AI Output" value="Rep cues, depth check, bar path note, confidence score (planned)." />
            {countdown > 0 ? <Text style={styles.countdownText}>Get ready... {countdown}</Text> : null}
            {showDemo ? (
              <View style={styles.demoWrap}>
                <StickFigureDemo exercise={selectedExercise} tick={tick} />
              </View>
            ) : null}
            {showDemo ? <Text style={styles.demoLabel}>Copy this motion rhythm</Text> : null}
            {!cameraPermissionGranted ? (
              <InfoRow label="Camera" value="Permission optional for now. Stick-figure coach still works." />
            ) : null}
            {cameraPermissionGranted ? (
              <View style={styles.cameraPreviewWrap}>
                <CameraView style={styles.cameraPreview} facing="front" />
              </View>
            ) : null}
            <Text style={styles.codeTitle}>Mock Form JSON</Text>
            <Text style={styles.codeBlock}>{JSON.stringify(mockAiResult, null, 2)}</Text>
            <Pressable style={styles.secondaryButton} onPress={onStopSession}>
              <Text style={styles.secondaryButtonText}>Stop Session</Text>
            </Pressable>
          </>
        ) : (
          <InfoRow label="Status" value="No active camera session. Select an exercise and start." />
        )}
      </GlassCard>
    </View>
  );
}
