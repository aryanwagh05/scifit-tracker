import { Pressable, Text, View } from 'react-native';
import { Card } from 'tamagui';
import { Brain, ClipboardList, User } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow, ProfileInput } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';

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
  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <User size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>Profile</Text>
        </View>
        <Text style={styles.heroTitle}>Athlete Setup</Text>
        <Text style={styles.heroSubtitle}>Save profile routes to Workout Log screen.</Text>
      </Card>

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
