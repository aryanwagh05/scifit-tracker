import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card } from 'tamagui';
import { Film, Image as LucideImage, Sparkles, Zap } from '@tamagui/lucide-icons';
import { GlassCard, InfoRow } from '@/src/shared/ui/atoms';
import { styles } from '@/src/shared/ui/styles';
import { analyzeMedia, type MediaAnalysisResult } from '@/src/services/geminiClient';

// ─── Smart JSON renderer ──────────────────────────────────────────────────────

function fmtKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function JsonNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    // Flat list of primitives → chips
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return (
        <View style={styles.exerciseChipWrap}>
          {value.map((v, i) => (
            <View key={i} style={styles.exerciseChip}>
              <Text style={styles.exerciseChipText}>{String(v)}</Text>
            </View>
          ))}
        </View>
      );
    }
    // Array of objects → stacked with dividers
    return (
      <View style={{ gap: 10 }}>
        {value.map((item, i) => (
          <View
            key={i}
            style={i > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(171,203,236,0.3)', paddingTop: 10 } : {}}
          >
            <JsonNode value={item} depth={depth + 1} />
          </View>
        ))}
      </View>
    );
  }

  if (typeof value === 'object') {
    return (
      <View style={{ gap: 12 }}>
        {Object.entries(value as Record<string, unknown>).map(([key, val]) => (
          <View key={key}>
            <Text style={styles.infoLabel}>{fmtKey(key)}</Text>
            <View style={{ marginTop: 4 }}>
              <JsonNode value={val} depth={depth + 1} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return <Text style={styles.infoValue}>{String(value)}</Text>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MediaAnalysisPage() {
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [mediaKind, setMediaKind] = useState<'image' | 'video'>('image');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('');
  const [result, setResult] = useState<MediaAnalysisResult | null>(null);
  const [error, setError] = useState('');

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!res.canceled && res.assets.length > 0) {
      const asset = res.assets[0];
      setPickedUri(asset.uri);
      setMimeType(asset.mimeType ?? 'image/jpeg');
      setMediaKind('image');
      setResult(null);
      setError('');
    }
  }

  async function pickVideo() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!res.canceled && res.assets.length > 0) {
      const asset = res.assets[0];
      setPickedUri(asset.uri);
      setMimeType(asset.mimeType ?? 'video/mp4');
      setMediaKind('video');
      setResult(null);
      setError('');
    }
  }

  async function runAnalysis() {
    if (!pickedUri || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      setPhase(mediaKind === 'video' ? 'Uploading video to Gemini...' : 'Sending image to Gemini...');
      const analysis = await analyzeMedia(pickedUri, mimeType, customPrompt || undefined);
      setResult(analysis);
      setPhase('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setPhase('');
    } finally {
      setLoading(false);
    }
  }

  // When a custom prompt is used, Gemini may return its own JSON schema
  // instead of the standard {summary, sentiment, safety_score, ...} shape.
  const hasStandardFields =
    result != null &&
    (result.summary != null || result.sentiment != null || result.safety_score != null);

  return (
    <View style={styles.pageStack}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Zap size={14} color="#9fd6ff" />
          <Text style={styles.heroEyebrow}>Gemini Flash</Text>
        </View>
        <Text style={styles.heroTitle}>Media Analysis</Text>
        <Text style={styles.heroSubtitle}>
          Upload an image or video. Gemini AI will analyze it and return structured insights — objects,
          sentiment, key moments, tags, and more.
        </Text>
      </Card>

      <GlassCard title="Pick Media" icon={LucideImage}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={[styles.secondaryButton, { flex: 1 }]} onPress={pickImage}>
            <Text style={styles.secondaryButtonText}>Pick Image</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { flex: 1 }]} onPress={pickVideo}>
            <Text style={styles.secondaryButtonText}>Pick Video</Text>
          </Pressable>
        </View>

        {pickedUri ? (
          mediaKind === 'image' ? (
            <Image
              source={{ uri: pickedUri }}
              style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 4 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: 100,
                borderRadius: 12,
                backgroundColor: '#ddeeff',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
                borderWidth: 1,
                borderColor: '#c2daf5',
              }}
            >
              <Film size={32} color="#5a82aa" />
              <Text style={{ color: '#4c6a88', fontWeight: '700', marginTop: 6 }}>Video selected</Text>
              <Text style={{ color: '#7898b5', fontSize: 11 }}>{mimeType}</Text>
            </View>
          )
        ) : null}

        <TextInput
          value={customPrompt}
          onChangeText={setCustomPrompt}
          multiline
          placeholder={`Optional: custom prompt\ne.g. "What's wrong with my squat form?" or "Analyze this meal"`}
          placeholderTextColor="#89a3bf"
          style={[styles.textarea, { minHeight: 70 }]}
        />

        <Pressable
          style={[styles.primaryButton, (!pickedUri || loading) && styles.runButtonDisabled]}
          onPress={runAnalysis}
          disabled={!pickedUri || loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#f2f8ff" />
              <Text style={styles.primaryButtonText}>{phase || 'Analyzing...'}</Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>
              {pickedUri ? 'Analyze with Gemini' : 'Pick a file first'}
            </Text>
          )}
        </Pressable>

        {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
      </GlassCard>

      {result ? (
        <>
          {hasStandardFields ? (
            // ── Standard schema ────────────────────────────────────────────
            <>
              <GlassCard title="AI Analysis" icon={Sparkles}>
                {result.summary ? <InfoRow label="Summary" value={result.summary} /> : null}
                {result.sentiment ? <InfoRow label="Sentiment" value={result.sentiment} /> : null}
                {result.safety_score != null ? (
                  <InfoRow
                    label="Safety Score"
                    value={`${(result.safety_score * 100).toFixed(0)}% safe`}
                  />
                ) : null}
              </GlassCard>

              {result.detected_objects?.length > 0 ? (
                <GlassCard title="Detected Objects" icon={Sparkles}>
                  <View style={styles.exerciseChipWrap}>
                    {result.detected_objects.map((obj, i) => (
                      <View key={`obj-${i}`} style={styles.exerciseChip}>
                        <Text style={styles.exerciseChipText}>{obj}</Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              ) : null}

              {result.tags?.length > 0 ? (
                <GlassCard title="Tags" icon={Sparkles}>
                  <View style={styles.exerciseChipWrap}>
                    {result.tags.map((tag, i) => (
                      <View
                        key={`tag-${i}`}
                        style={[styles.exerciseChip, { backgroundColor: 'rgba(220,240,255,0.9)' }]}
                      >
                        <Text style={styles.exerciseChipText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              ) : null}

              {result.key_moments?.length > 0 ? (
                <GlassCard title="Key Moments" icon={Film}>
                  {result.key_moments.map((moment, i) => (
                    <InfoRow key={`moment-${i}`} label={moment.timestamp} value={moment.description} />
                  ))}
                </GlassCard>
              ) : null}
            </>
          ) : (
            // ── Custom prompt response — render any JSON shape cleanly ──────
            <GlassCard title="Analysis" icon={Sparkles}>
              <JsonNode value={result as unknown} />
            </GlassCard>
          )}
        </>
      ) : null}
    </View>
  );
}
