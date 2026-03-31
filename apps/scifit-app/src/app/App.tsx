import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import tamaguiConfig from '@/tamagui.config';
import type { FormAnalysisResult } from '@/src/services/geminiClient';
import type { RouteKey } from '@/src/app/navigation/types';
import { styles } from '@/src/shared/ui/styles';
import { GlassBackdrop } from '@/src/shared/ui/atoms';
import { BottomNav } from '@/src/features/navigation/BottomNav';
import { DashboardPage } from '@/src/features/dashboard/DashboardPage';
import { LoginPage } from '@/src/features/auth/LoginPage';
import { ProfilePage } from '@/src/features/profile/ProfilePage';
import { WorkoutLogPage, type ExerciseEntry } from '@/src/features/workout/WorkoutLogPage';
import { AIAnalysisPage } from '@/src/features/coach/AIAnalysisPage';

export default function App() {
  const [route, setRoute] = useState<RouteKey>('dashboard');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('74');
  const [goal, setGoal] = useState('Lean Bulk');
  const [daysPerWeek, setDaysPerWeek] = useState('4');

  const [analyses, setAnalyses] = useState<FormAnalysisResult[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);

  const addAnalysis = (result: FormAnalysisResult) => {
    setAnalyses((prev) => [...prev, result]);
  };

  const addExercise = (entry: ExerciseEntry) => {
    setExercises((prev) => [...prev, entry]);
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

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
                  onOpenCameraGuide={() => setRoute('formAnalysis')}
                  onGoCoach={() => setRoute('formAnalysis')}
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

              {route === 'workoutLog' ? (
                <WorkoutLogPage
                  analyses={analyses}
                  exercises={exercises}
                  onAddExercise={addExercise}
                  onRemoveExercise={removeExercise}
                  onGoCoach={() => setRoute('formAnalysis')}
                />
              ) : null}

              {route === 'formAnalysis' ? (
                <AIAnalysisPage analyses={analyses} onAnalysisComplete={addAnalysis} />
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>

          <BottomNav route={route} setRoute={setRoute} />
        </SafeAreaView>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}
