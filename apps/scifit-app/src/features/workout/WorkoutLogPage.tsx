import { Pressable, Text, View } from 'react-native';
import { Card } from 'tamagui';
import { Brain, ClipboardList } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';

export function WorkoutLogPage() {
  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <ClipboardList size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>Workout Log</Text>
        </View>
        <Text style={styles.heroTitle}>{new Date().toLocaleDateString()}</Text>
        <Text style={styles.heroSubtitle}>User flow placeholder for workout tracking.</Text>
      </Card>

      <GlassCard title="Session" icon={ClipboardList}>
        <Pressable style={styles.primaryButton} onPress={() => {}}>
          <Text style={styles.primaryButtonText}>Add Exercise</Text>
        </Pressable>

        <View style={styles.placeholderList}>
          <Text style={styles.placeholderItem}>- Squat (placeholder)</Text>
          <Text style={styles.placeholderItem}>- Bench Press (placeholder)</Text>
          <Text style={styles.placeholderItem}>- Barbell Row (placeholder)</Text>
        </View>
      </GlassCard>

      <GlassCard title="Connected Analytics (Planned)" icon={Brain}>
        <InfoRow label="PR Detection" value="Track best load/reps per exercise over time." />
        <InfoRow label="Weekly Volume" value="Map exercise sets to muscle-group workload." />
        <InfoRow label="Plateau Flags" value="Identify stalled lifts with recovery context." />
      </GlassCard>
    </View>
  );
}
