import { Pressable, Text, View } from 'react-native';
import { Card } from 'tamagui';
import { Brain, ClipboardList, LogOut, User } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow, ProfileInput } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';
import { useAuth } from '@/src/context/AuthContext';

export function ProfilePage({
  height,
  setHeight,
  weight,
  setWeight,
  goal,
  setGoal,
  daysPerWeek,
  setDaysPerWeek,
  onSaveProfile
}: {
  height: string;
  setHeight: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  goal: string;
  setGoal: (value: string) => void;
  daysPerWeek: string;
  setDaysPerWeek: (value: string) => void;
  onSaveProfile: () => void;
}) {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <User size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>Profile</Text>
        </View>
        <Text style={styles.heroTitle}>Athlete Setup</Text>
        <Text style={styles.heroSubtitle}>
          {user?.email ?? 'Not signed in'}
        </Text>
      </Card>

      {/* Signed in account info + sign out */}
      <GlassCard title="Account" icon={User}>
        <InfoRow label="Email" value={user?.email ?? '—'} />
        <InfoRow label="User ID" value={user?.id ? `${user.id.slice(0, 8)}...` : '—'} />
        <InfoRow
          label="Joined"
          value={user?.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : '—'}
        />

        <Pressable
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={signOut}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <LogOut size={14} color="#89a3bf" />
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </View>
        </Pressable>
      </GlassCard>

      <GlassCard title="Profile Inputs" icon={ClipboardList}>
        <ProfileInput label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
        <ProfileInput label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
        <ProfileInput label="Goal" value={goal} onChangeText={setGoal} />
        <ProfileInput label="Days / Week" value={daysPerWeek} onChangeText={setDaysPerWeek} keyboardType="numeric" />

        <Pressable style={styles.primaryButton} onPress={onSaveProfile}>
          <Text style={styles.primaryButtonText}>Save Profile</Text>
        </Pressable>
      </GlassCard>

      <GlassCard title="How AI Uses Profile Data" icon={Brain}>
        <InfoRow label="Goal + Days/Week" value="Drives split recommendation and training density." />
        <InfoRow label="Body Metrics" value="Supports nutrition targets and progression estimates." />
        <InfoRow label="Experience" value="Used for intensity and volume defaults (next iteration)." />
      </GlassCard>
    </View>
  );
}