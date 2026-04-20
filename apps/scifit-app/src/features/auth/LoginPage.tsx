import { useState } from 'react';
import { Pressable, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { Card } from 'tamagui';
import { Sparkles, User } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';
import { useAuth } from '@/src/context/AuthContext';

export function LoginPage({
  onLogIn,
  onCreateAccount,
}: {
  onLogIn: () => void;
  onCreateAccount: () => void;
}) {
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  async function handleLogIn() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onLogIn();
    }
  }

  async function handleCreateAccount() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {

      setError('Account created! Check your email to confirm, then log in.');
      setMode('login');
    }
  }

  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <User size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>
            {mode === 'login' ? 'Login' : 'Create Account'}
          </Text>
        </View>
        <Text style={styles.heroTitle}>
          {mode === 'login' ? 'Welcome Back' : 'Get Started'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {mode === 'login' ? 'Sign in to your account.' : 'Create your SCIFIT account.'}
        </Text>
      </Card>

      <GlassCard title={mode === 'login' ? 'Sign In' : 'Sign Up'} icon={User}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor="#89a3bf"
            style={styles.authInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter password"
            placeholderTextColor="#89a3bf"
            style={styles.authInput}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            autoComplete={mode === 'login' ? 'password' : 'password-new'}
          />
        </View>

        {error ? (
          <Text style={{ color: error.includes('created') ? '#4caf50' : '#ff6b6b', marginBottom: 8, fontSize: 13 }}>
            {error}
          </Text>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 12 }} />
        ) : (
          <>
            <Pressable
              style={styles.primaryButton}
              onPress={mode === 'login' ? handleLogIn : handleCreateAccount}
            >
              <Text style={styles.primaryButtonText}>
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setError('');
                setMode(mode === 'login' ? 'signup' : 'login');
              }}
            >
              <Text style={styles.secondaryButtonText}>
                {mode === 'login' ? 'Create Account' : 'Back to Log In'}
              </Text>
            </Pressable>
          </>
        )}
      </GlassCard>

      <GlassCard title="About SCIFIT" icon={Sparkles}>
        <InfoRow label="Purpose" value="AI-powered fitness tracking and coaching." />
        <InfoRow label="Auth" value="Secured with Supabase email/password authentication." />
      </GlassCard>
    </View>
  );
}