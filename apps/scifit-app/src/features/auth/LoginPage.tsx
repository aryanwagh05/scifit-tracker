import { Pressable, Text, TextInput, View } from 'react-native';
import { Card } from 'tamagui';
import { Sparkles, User } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';

export function LoginPage({
  email,
  password,
  setEmail,
  setPassword,
  onLogIn,
  onCreateAccount
}: {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onLogIn: () => void;
  onCreateAccount: () => void;
}) {
  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <User size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>Login</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome Back</Text>
        <Text style={styles.heroSubtitle}>Frontend flow only. No auth validation yet.</Text>
      </Card>

      <GlassCard title="Sign In" icon={User}>
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
            textContentType="password"
            autoComplete="password"
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={onLogIn}>
          <Text style={styles.primaryButtonText}>Log In</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onCreateAccount}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </Pressable>
      </GlassCard>

      <GlassCard title="Why This Screen Exists" icon={Sparkles}>
        <InfoRow label="Purpose" value="Simple auth flow checkpoint for MVP navigation." />
        <InfoRow label="Current Mode" value="Frontend-only flow test (no backend validation)." />
      </GlassCard>
    </View>
  );
}
