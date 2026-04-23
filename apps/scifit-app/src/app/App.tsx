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
import { AuthProvider, useAuth } from '@/src/context/AuthContext';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [route, setRoute] = useState<RouteKey>('dashboard');

  const [question, setQuestion] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [result, setResult] = useState<RagResponse | null>(null);
  const [error, setError] = useState('');

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
    if (!question.trim() || queryLoading) return;
    setQueryLoading(true);
    setError('');
    try {
      const next = await askRag(question, 5);
      setResult(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setQueryLoading(false);
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

  if (authLoading) return null;

  if (!user) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <GlassBackdrop />
        <LoginPage
          onLogIn={() => setRoute('dashboard')}
          onCreateAccount={() => setRoute('profile')}
        />
      </SafeAreaView>
    );
  }

  return (
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
          {route === 'dashboard' && (
            <DashboardPage
              onOpenCameraGuide={() => setCameraGuideOpen(true)}
              onGoCoach={() => setRoute('aiCoach')}
            />
          )}
          {route === 'login' && (
            <LoginPage
              onLogIn={() => setRoute('dashboard')}
              onCreateAccount={() => setRoute('profile')}
            />
          )}
          {route === 'profile' && (
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
          )}
          {route === 'workoutLog' && <WorkoutLogPage />}
          {route === 'raglab' && (
            <RagLabPage
              question={question}
              setQuestion={setQuestion}
              loading={queryLoading}
              runQuery={runQuery}
              error={error}
              result={result}
              confidence={confidence}
            />
          )}
          {route === 'aiCoach' && (
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
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNav route={route} setRoute={setRoute} />
      <AICameraGuideModal open={cameraGuideOpen} onClose={() => setCameraGuideOpen(false)} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}