import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import tamaguiConfig from '@/tamagui.config';
import { askRag, type RagResponse } from '@/src/services/ragClient';
import type { RouteKey } from '@/src/app/navigation/types';
import { styles } from '@/src/shared/ui/styles';
import { GlassBackdrop } from '@/src/shared/ui/atoms';
import { BottomNav } from '@/src/features/navigation/BottomNav';
import { DashboardPage } from '@/src/features/dashboard/DashboardPage';
import { LoginPage } from '@/src/features/auth/LoginPage';
import { ProfilePage } from '@/src/features/profile/ProfilePage';
import { WorkoutLogPage } from '@/src/features/workout/WorkoutLogPage';
import { RagLabPage } from '@/src/features/rag/RagLabPage';
import { AICoachPage } from '@/src/features/coach/AICoachPage';
import { AICameraGuideModal } from '@/src/features/coach/AICameraGuideModal';
import { MediaAnalysisPage } from '@/src/features/media/MediaAnalysisPage';

export default function App() {
  const [route, setRoute] = useState<RouteKey>('dashboard');

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagResponse | null>(null);
  const [error, setError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('74');
  const [goal, setGoal] = useState('Lean Bulk');
  const [daysPerWeek, setDaysPerWeek] = useState('4');

  const [cameraGuideOpen, setCameraGuideOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('Back Squat');
  const [coachSessionActive, setCoachSessionActive] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const confidence = useMemo(() => {
    if (!result) return 'Awaiting query';
    if (result.confidence >= 0.75) return 'High';
    if (result.confidence >= 0.45) return 'Moderate';
    return 'Low';
  }, [result]);

  async function runQuery() {
    if (!question.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const next = await askRag(question, 5);
      setResult(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  }

  async function ensureCameraPermission() {
    if (cameraPermission?.granted) return true;
    const res = await requestCameraPermission();
    return !!res.granted;
  }

  async function startCoachSession() {
    const granted = await ensureCameraPermission();
    if (!granted) {
      setCoachSessionActive(false);
      return false;
    }

    setCoachSessionActive(true);
    return true;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <StatusBar style="dark" />
          <GlassBackdrop />

          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {route === 'dashboard' ? (
                <DashboardPage
                  onOpenCameraGuide={() => setCameraGuideOpen(true)}
                  onGoCoach={() => setRoute('aiCoach')}
                />
              ) : null}

              {route === 'login' ? (
                <LoginPage
                  email={loginEmail}
                  password={loginPassword}
                  setEmail={setLoginEmail}
                  setPassword={setLoginPassword}
                  onLogIn={() => setRoute('dashboard')}
                  onCreateAccount={() => setRoute('profile')}
                />
              ) : null}

              {route === 'profile' ? (
                <ProfilePage
                  height={height}
                  setHeight={setHeight}
                  weight={weight}
                  setWeight={setWeight}
                  goal={goal}
                  setGoal={setGoal}
                  daysPerWeek={daysPerWeek}
                  setDaysPerWeek={setDaysPerWeek}
                  onSaveProfile={() => setRoute('workoutLog')}
                />
              ) : null}

              {route === 'workoutLog' ? <WorkoutLogPage /> : null}

              {route === 'raglab' ? (
                <RagLabPage
                  question={question}
                  setQuestion={setQuestion}
                  loading={loading}
                  runQuery={runQuery}
                  error={error}
                  result={result}
                  confidence={confidence}
                />
              ) : null}

              {route === 'aiCoach' ? (
                <AICoachPage
                  selectedExercise={selectedExercise}
                  setSelectedExercise={setSelectedExercise}
                  coachSessionActive={coachSessionActive}
                  cameraPermissionGranted={!!cameraPermission?.granted}
                  onRequestCameraPermission={ensureCameraPermission}
                  onStartSession={startCoachSession}
                  onStopSession={() => setCoachSessionActive(false)}
                  onOpenGuide={() => setCameraGuideOpen(true)}
                />
              ) : null}

              {route === 'mediaAnalysis' ? <MediaAnalysisPage /> : null}
            </ScrollView>
          </KeyboardAvoidingView>

          <BottomNav route={route} setRoute={setRoute} />
          <AICameraGuideModal open={cameraGuideOpen} onClose={() => setCameraGuideOpen(false)} />
        </SafeAreaView>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}
