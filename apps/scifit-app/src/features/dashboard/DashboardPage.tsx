import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from 'tamagui';
import { BookOpen, Camera, ClipboardList, TrendingUp, Zap } from '@tamagui/lucide-icons';
import { GlassCard, Metric } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage({
  onGoCoach,
}: {
  onOpenCameraGuide: () => void;
  onGoCoach: () => void;
}) {
  return (
    <View style={styles.pageStack}>
      {/* Hero */}
      <Card style={styles.heroCard}>
        <Text style={local.greeting}>{getGreeting()}</Text>
        <Text style={styles.heroTitle}>SciFit Tracker</Text>
        <Text style={styles.heroSubtitle}>
          AI-powered form analysis backed by exercise science research.
        </Text>
      </Card>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <Metric label="Weekly Volume" value="14 sets" />
        <Metric label="Recovery" value="82%" />
        <Metric label="Sleep Avg" value="7h 18m" />
      </View>

      {/* Primary CTA */}
      <Pressable style={local.ctaCard} onPress={onGoCoach}>
        <View style={local.ctaIconWrap}>
          <Camera size={28} color="#fff" />
        </View>
        <View style={local.ctaText}>
          <Text style={local.ctaTitle}>Analyze Your Form</Text>
          <Text style={local.ctaSubtitle}>Record a set — get AI feedback + research cues</Text>
        </View>
        <Zap size={18} color="#7db8f0" />
      </Pressable>

      {/* Feature highlights */}
      <GlassCard title="What SciFit Does" icon={Zap}>
        <View style={local.featureGrid}>
          <View style={local.featureItem}>
            <View style={[local.featureIcon, { backgroundColor: '#eaf2ff' }]}>
              <Camera size={18} color="#4f7fb2" />
            </View>
            <Text style={local.featureLabel}>Form Analysis</Text>
            <Text style={local.featureDesc}>AI scores your technique and flags issues</Text>
          </View>
          <View style={local.featureItem}>
            <View style={[local.featureIcon, { backgroundColor: '#edfaf3' }]}>
              <BookOpen size={18} color="#2a7a4b" />
            </View>
            <Text style={local.featureLabel}>Research Backed</Text>
            <Text style={local.featureDesc}>Cues from peer-reviewed exercise science</Text>
          </View>
          <View style={local.featureItem}>
            <View style={[local.featureIcon, { backgroundColor: '#fff6ed' }]}>
              <ClipboardList size={18} color="#b86a10" />
            </View>
            <Text style={local.featureLabel}>Workout Log</Text>
            <Text style={local.featureDesc}>Track sets, reps, and weight per session</Text>
          </View>
          <View style={local.featureItem}>
            <View style={[local.featureIcon, { backgroundColor: '#fdf0f8' }]}>
              <TrendingUp size={18} color="#a0439f" />
            </View>
            <Text style={local.featureLabel}>Progress Trends</Text>
            <Text style={local.featureDesc}>Compare form scores across sessions</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

const local = StyleSheet.create({
  greeting: {
    color: '#6a90b8',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    backgroundColor: '#3a6fa8',
    padding: 18,
    shadowColor: '#2d5a8a',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  ctaIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    flex: 1,
    gap: 3,
  },
  ctaTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 17,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureItem: {
    width: '47%',
    gap: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(248,252,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,240,0.5)',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  featureLabel: {
    color: '#1f2e40',
    fontWeight: '800',
    fontSize: 13,
  },
  featureDesc: {
    color: '#5878a3',
    fontSize: 11,
    lineHeight: 16,
  },
});
