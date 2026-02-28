import { Pressable, Text, View } from 'react-native';
import { Card } from 'tamagui';
import { Camera, Sparkles } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow, Metric } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';

export function DashboardPage({
  onOpenCameraGuide,
  onGoCoach
}: {
  onOpenCameraGuide: () => void;
  onGoCoach: () => void;
}) {
  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Sparkles size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>Main Dashboard</Text>
        </View>
        <Text style={styles.heroTitle}>SciFit Command</Text>
        <Text style={styles.heroSubtitle}>Flow-test dashboard with dummy values.</Text>
      </Card>

      <View style={styles.metricsRow}>
        <Metric label="Weekly Volume" value="14 sets" />
        <Metric label="Recovery" value="82%" />
        <Metric label="Sleep Avg" value="7h 18m" />
      </View>

      <GlassCard title="Quick Actions" icon={Camera}>
        <Pressable style={styles.secondaryButton} onPress={onGoCoach}>
          <Text style={styles.secondaryButtonText}>Open AI Trainer Coach Screen</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={onOpenCameraGuide}>
          <Text style={styles.primaryButtonText}>Open AI Camera Training Guide</Text>
        </Pressable>
      </GlassCard>

      <GlassCard title="Project Scope" icon={Sparkles}>
        <InfoRow label="Vision" value="Data + science + AI for smarter training decisions." />
        <InfoRow label="Core Problems" value="Generic advice, no stall explanation, disconnected metrics." />
        <InfoRow label="AI Systems" value="RAG assistant, multimodal form/meal analysis, plan recommender." />
        <InfoRow label="Stack" value="React Native + Supabase + AI/ML pipelines." />
      </GlassCard>
    </View>
  );
}
