import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Card } from 'tamagui';
import { Brain, Search, Sparkles } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow, Metric } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';
import type { RagResponse } from '@/src/services/ragClient';

export const QUICK_PROMPTS = [
  'What weekly set range has strongest support for hypertrophy?',
  'Is training to failure superior when volume is matched?',
  'How much protein per day improves lean mass outcomes?'
];

export function RagLabPage({
  question,
  setQuestion,
  loading,
  runQuery,
  error,
  result,
  confidence
}: {
  question: string;
  setQuestion: (value: string) => void;
  loading: boolean;
  runQuery: () => Promise<void>;
  error: string;
  result: RagResponse | null;
  confidence: string;
}) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      glow.stopAnimation();
      glow.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(glow, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      })
    );

    loop.start();
    return () => loop.stop();
  }, [loading, glow]);

  const innerTrailScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12]
  });

  const outerTrailScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22]
  });

  const innerTrailOpacity = glow.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.58, 0.22, 0]
  });

  const outerTrailOpacity = glow.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.36, 0.14, 0]
  });

  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Search size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>RAG LAB</Text>
        </View>
        <Text style={styles.heroTitle}>Evidence Engine</Text>
        <Text style={styles.heroSubtitle}>Ask questions and inspect source-backed answers.</Text>
      </Card>

      <View style={styles.metricsRow}>
        <Metric label="Confidence" value={confidence} />
        <Metric label="Citations" value={`${result?.citations.length ?? 0}`} />
      </View>

      <GlassCard title="Ask Research Question" icon={Brain}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          multiline
          placeholder="Try: Do higher frequencies outperform lower frequencies when weekly volume is matched?"
          placeholderTextColor="#89a3bf"
          style={styles.textarea}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pillRow}>
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable key={prompt} onPress={() => setQuestion(prompt)} style={styles.promptPill}>
                <Text style={styles.promptPillText}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.runButtonContainer}>
          {loading ? (
            <>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.runButtonTrail,
                  styles.runButtonTrailOuter,
                  { opacity: outerTrailOpacity, transform: [{ scale: outerTrailScale }] }
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.runButtonTrail,
                  styles.runButtonTrailInner,
                  { opacity: innerTrailOpacity, transform: [{ scale: innerTrailScale }] }
                ]}
              />
            </>
          ) : null}
          <Pressable
            disabled={loading || !question.trim()}
            onPress={runQuery}
            style={[
              styles.primaryButton,
              loading && styles.runButtonRunning,
              (loading || !question.trim()) && styles.runButtonDisabled
            ]}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Running query...' : 'Run Query'}</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
      </GlassCard>

      <GlassCard title="LLM Answer" icon={Sparkles}>
        <Text style={styles.answerText}>{result?.answer ?? 'No answer yet. Run a query to see the response.'}</Text>
      </GlassCard>

      <GlassCard title="Citations" icon={Search}>
        {result?.citations?.length ? (
          <View style={styles.citationList}>
            {result.citations.map((citation, index) => (
              <View key={`${citation.chunk_id}-${index}`} style={styles.citationItem}>
                <Text style={styles.citationTitle}>{citation.title}</Text>
                <Text style={styles.citationMeta}>Source: {citation.source}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholderItem}>No citations yet.</Text>
        )}
      </GlassCard>

      <GlassCard title="Research-Grounded AI" icon={Search}>
        <InfoRow label="Source Type" value="Curated exercise-science cards and PubMed evidence." />
        <InfoRow label="Safety Goal" value="Reduce hallucinations by citing retrieved sources only." />
        <InfoRow label="Current Stage" value="Text assistant active; multimodal layer in progress." />
      </GlassCard>
    </View>
  );
}
