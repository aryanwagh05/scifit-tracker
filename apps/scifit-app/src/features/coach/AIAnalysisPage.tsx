import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Edit3,
  Film,
  Loader,
  Trophy,
  Video,
  Zap,
} from '@tamagui/lucide-icons';
import { GlassCard } from '@/src/shared/ui/atoms';
import { styles as globalStyles } from '@/src/shared/ui/styles';
import { analyzeFormVideo, type FormAnalysisResult, type FormIssue } from '@/src/services/geminiClient';
import { askRag } from '@/src/services/ragClient';
import {
  isSupabaseConfigured,
  saveAnalysisResult,
  uploadVideoToStorage,
} from '@/src/services/supabaseClient';

const EXERCISES = ['Back Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row'];

type StepStatus = 'pending' | 'running' | 'done' | 'error';

type ProcessingStep = {
  id: string;
  label: string;
  status: StepStatus;
  timestamp?: string;
  detail?: string;
};

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'storage', label: 'Upload to Supabase Storage', status: 'pending' },
  { id: 'gemini', label: 'Gemini form analysis', status: 'pending' },
  { id: 'rag', label: 'Fetch research evidence', status: 'pending' },
  { id: 'save', label: 'Save analysis result', status: 'pending' },
];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function severityColor(s: FormIssue['severity']) {
  if (s === 'critical') return '#c03131';
  if (s === 'moderate') return '#b86a10';
  return '#2a7a4b';
}

function severityBg(s: FormIssue['severity']) {
  if (s === 'critical') return '#fff0f0';
  if (s === 'moderate') return '#fff6ed';
  return '#f0faf4';
}

function scoreColor(score: number) {
  if (score >= 75) return '#2a7a4b';
  if (score >= 50) return '#b86a10';
  return '#c03131';
}

type Props = {
  analyses: FormAnalysisResult[];
  onAnalysisComplete: (result: FormAnalysisResult) => void;
};

export function AIAnalysisPage({ analyses, onAnalysisComplete }: Props) {
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customExerciseText, setCustomExerciseText] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('video/mp4');
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<FormAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!isRecording) setRecordDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      alert('Camera recording is not supported on web. Use "Pick from Library" instead.');
      return;
    }
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) return;
    }
    if (!micPermission?.granted) {
      await requestMicPermission();
    }
    setVideoUri(null);
    setShowCamera(true);
    setCurrentAnalysis(null);
    setAnalysisError(null);
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    setIsRecording(true);
    try {
      const result = await cameraRef.current.recordAsync({ maxDuration: 90 });
      if (result?.uri) {
        setVideoUri(result.uri);
        setMimeType('video/mp4');
        setShowCamera(false);
      }
    } catch {
      // recording was stopped or cancelled
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const pickFromLibrary = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 90,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      setMimeType(asset.mimeType ?? 'video/mp4');
      setShowCamera(false);
      setCurrentAnalysis(null);
      setAnalysisError(null);
    }
  };

  const updateStep = (id: string, patch: Partial<ProcessingStep>) => {
    setProcessingSteps((steps) =>
      steps.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const runAnalysis = async () => {
    if (!videoUri || isAnalyzing) return;

    setIsAnalyzing(true);
    setCurrentAnalysis(null);
    setAnalysisError(null);
    setProcessingSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending', timestamp: undefined, detail: undefined })));

    try {
      // Step 1: Supabase Storage upload
      updateStep('storage', { status: 'running', timestamp: new Date().toISOString() });
      let mediaUrl: string | undefined;
      if (isSupabaseConfigured()) {
        const url = await uploadVideoToStorage(videoUri, 'user_1', selectedExercise);
        mediaUrl = url ?? undefined;
        updateStep('storage', {
          status: 'done',
          detail: mediaUrl ? 'Stored in videos bucket' : 'Upload returned no URL',
          timestamp: new Date().toISOString(),
        });
      } else {
        updateStep('storage', {
          status: 'done',
          detail: 'Supabase not configured — set EXPO_PUBLIC_SUPABASE_URL to enable',
          timestamp: new Date().toISOString(),
        });
      }

      // Step 2: Gemini form analysis
      updateStep('gemini', { status: 'running', timestamp: new Date().toISOString() });
      const geminiResult = await analyzeFormVideo(videoUri, mimeType, selectedExercise);
      updateStep('gemini', {
        status: 'done',
        detail: `Score ${geminiResult.overall_score}/100 · ${geminiResult.rep_count} rep${geminiResult.rep_count !== 1 ? 's' : ''} · ${geminiResult.form_issues.length} issue${geminiResult.form_issues.length !== 1 ? 's' : ''} found`,
        timestamp: new Date().toISOString(),
      });

      // Step 3: RAG research evidence
      updateStep('rag', { status: 'running', timestamp: new Date().toISOString() });
      let ragEvidence: string | undefined;
      let ragCitations: { title: string; source: string }[] | undefined;
      try {
        const ragResult = await askRag(
          `${selectedExercise} proper form technique common errors cues`,
          3
        );
        if (ragResult.answer && !ragResult.answer.includes('not connected')) {
          ragEvidence = ragResult.answer;
          ragCitations = ragResult.citations;
          updateStep('rag', {
            status: 'done',
            detail: `${ragResult.citations.length} citation${ragResult.citations.length !== 1 ? 's' : ''} retrieved`,
            timestamp: new Date().toISOString(),
          });
        } else {
          updateStep('rag', {
            status: 'done',
            detail: 'RAG not configured — set EXPO_PUBLIC_RAG_API_URL to enable',
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        updateStep('rag', { status: 'done', detail: 'Evidence unavailable', timestamp: new Date().toISOString() });
      }

      // Step 4: Save result
      updateStep('save', { status: 'running', timestamp: new Date().toISOString() });
      const fullResult: FormAnalysisResult = {
        ...geminiResult,
        media_url: mediaUrl,
        rag_evidence: ragEvidence,
        rag_citations: ragCitations,
      };

      if (isSupabaseConfigured()) {
        await saveAnalysisResult(fullResult);
        updateStep('save', { status: 'done', detail: 'Saved to media_uploads table', timestamp: new Date().toISOString() });
      } else {
        updateStep('save', { status: 'done', detail: 'Saved locally (Supabase not configured)', timestamp: new Date().toISOString() });
      }

      setCurrentAnalysis(fullResult);
      onAnalysisComplete(fullResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setAnalysisError(msg);
      setProcessingSteps((steps) =>
        steps.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s))
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetCapture = () => {
    setVideoUri(null);
    setCurrentAnalysis(null);
    setAnalysisError(null);
    setProcessingSteps(INITIAL_STEPS);
  };

  return (
    <View style={globalStyles.pageStack}>
      {/* Hero */}
      <View style={local.heroCard}>
        <View style={local.heroRow}>
          <Zap size={16} color="#4f7fb2" />
          <Text style={local.heroEyebrow}>AI Form Coach</Text>
        </View>
        <Text style={local.heroTitle}>Form Analysis</Text>
        <Text style={local.heroSubtitle}>
          Record or upload a set — Gemini analyzes your technique and research evidence backs every cue.
        </Text>
      </View>

      {/* Exercise Selector */}
      <GlassCard title="Select Exercise" icon={Trophy}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
          <View style={globalStyles.exerciseChipWrap}>
            {EXERCISES.map((ex) => (
              <Pressable
                key={ex}
                onPress={() => { setSelectedExercise(ex); setShowCustomInput(false); }}
                style={[
                  globalStyles.exerciseChip,
                  selectedExercise === ex && !showCustomInput && globalStyles.exerciseChipActive,
                ]}
              >
                <Text
                  style={[
                    globalStyles.exerciseChipText,
                    selectedExercise === ex && !showCustomInput && globalStyles.exerciseChipTextActive,
                  ]}
                >
                  {ex}
                </Text>
              </Pressable>
            ))}
            {/* Custom chip */}
            <Pressable
              onPress={() => setShowCustomInput((v) => !v)}
              style={[
                globalStyles.exerciseChip,
                (showCustomInput || !EXERCISES.includes(selectedExercise)) && globalStyles.exerciseChipActive,
                { flexDirection: 'row', gap: 4, alignItems: 'center' },
              ]}
            >
              <Edit3
                size={11}
                color={showCustomInput || !EXERCISES.includes(selectedExercise) ? '#f3f9ff' : '#4f6e8f'}
              />
              <Text
                style={[
                  globalStyles.exerciseChipText,
                  (showCustomInput || !EXERCISES.includes(selectedExercise)) && globalStyles.exerciseChipTextActive,
                ]}
              >
                {!EXERCISES.includes(selectedExercise) && !showCustomInput ? selectedExercise : 'Custom...'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
        {showCustomInput ? (
          <View style={local.customInputRow}>
            <TextInput
              value={customExerciseText}
              onChangeText={setCustomExerciseText}
              placeholder="Enter exercise name"
              placeholderTextColor="#89a3bf"
              style={local.customInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                if (customExerciseText.trim()) {
                  setSelectedExercise(customExerciseText.trim());
                  setShowCustomInput(false);
                  setCustomExerciseText('');
                }
              }}
            />
            <Pressable
              style={local.customConfirmBtn}
              onPress={() => {
                if (customExerciseText.trim()) {
                  setSelectedExercise(customExerciseText.trim());
                  setShowCustomInput(false);
                  setCustomExerciseText('');
                }
              }}
            >
              <Text style={local.customConfirmText}>Set</Text>
            </Pressable>
          </View>
        ) : null}
      </GlassCard>

      {/* Camera / Video Capture */}
      {showCamera ? (
        <View style={local.cameraCard}>
          <CameraView
            ref={cameraRef}
            style={local.cameraView}
            facing="back"
            mode="video"
          />
          <View style={local.cameraControls}>
            {isRecording ? (
              <>
                <View style={local.recordingIndicator}>
                  <View style={local.recordingDot} />
                  <Text style={local.recordingTimer}>{fmtDuration(recordDuration)}</Text>
                </View>
                <Pressable onPress={stopRecording} style={local.stopBtn}>
                  <Text style={local.stopBtnText}>Stop</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={startRecording} style={local.recordBtn}>
                  <Video size={18} color="#fff" />
                  <Text style={local.recordBtnText}>Record</Text>
                </Pressable>
                <Pressable onPress={() => setShowCamera(false)} style={local.cancelBtn}>
                  <Text style={local.cancelBtnText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : (
        <GlassCard title="Capture Video" icon={Camera}>
          {videoUri ? (
            <View style={local.videoReadyBanner}>
              <Film size={18} color="#2a7a4b" />
              <Text style={local.videoReadyText}>Video ready for analysis</Text>
              <Pressable onPress={resetCapture} style={local.clearBtn}>
                <Text style={local.clearBtnText}>Clear</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={local.captureHint}>
              Record a short set (up to 90 seconds) or pick an existing video from your library.
            </Text>
          )}
          <View style={local.captureButtonRow}>
            {Platform.OS !== 'web' && (
              <Pressable onPress={openCamera} style={[globalStyles.primaryButton, local.halfBtn]}>
                <Camera size={16} color="#f2f8ff" />
                <Text style={globalStyles.primaryButtonText}>Record</Text>
              </Pressable>
            )}
            <Pressable onPress={pickFromLibrary} style={[globalStyles.secondaryButton, local.halfBtn]}>
              <Film size={16} color="#446587" />
              <Text style={globalStyles.secondaryButtonText}>Library</Text>
            </Pressable>
          </View>
        </GlassCard>
      )}

      {/* Analyze Button */}
      {!showCamera && (
        <Pressable
          onPress={runAnalysis}
          disabled={!videoUri || isAnalyzing}
          style={[
            globalStyles.primaryButton,
            (!videoUri || isAnalyzing) && globalStyles.runButtonDisabled,
            isAnalyzing && globalStyles.runButtonRunning,
          ]}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Zap size={16} color={videoUri ? '#f2f8ff' : '#aab8c5'} />
          )}
          <Text
            style={[
              globalStyles.primaryButtonText,
              (!videoUri || isAnalyzing) && { color: '#aab8c5' },
            ]}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Form'}
          </Text>
        </Pressable>
      )}

      {/* Processing Status */}
      {(isAnalyzing || currentAnalysis || analysisError) && (
        <GlassCard title="Processing Status" icon={Loader}>
          <View style={local.stepList}>
            {processingSteps.map((step) => (
              <View key={step.id} style={local.stepRow}>
                <View style={local.stepIcon}>
                  {step.status === 'done' && <CheckCircle size={16} color="#2a7a4b" />}
                  {step.status === 'running' && <ActivityIndicator size="small" color="#4f7fb2" />}
                  {step.status === 'pending' && <Circle size={16} color="#b0c0d4" />}
                  {step.status === 'error' && <AlertCircle size={16} color="#c03131" />}
                </View>
                <View style={local.stepContent}>
                  <Text style={[local.stepLabel, step.status === 'done' && local.stepLabelDone]}>
                    {step.label}
                  </Text>
                  {step.detail ? <Text style={local.stepDetail}>{step.detail}</Text> : null}
                  {step.timestamp ? (
                    <View style={local.stepTimestamp}>
                      <Clock size={10} color="#8fa8c0" />
                      <Text style={local.stepTimestampText}>{fmtTime(step.timestamp)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      {/* Error */}
      {analysisError ? (
        <View style={local.errorCard}>
          <AlertCircle size={16} color="#c03131" />
          <Text style={local.errorText}>{analysisError}</Text>
        </View>
      ) : null}

      {/* Analysis Results */}
      {currentAnalysis ? <AnalysisResults result={currentAnalysis} /> : null}

      {/* History */}
      {analyses.length > 0 ? (
        <GlassCard title={`Analysis History (${analyses.length})`} icon={Clock}>
          <Pressable
            onPress={() => setHistoryExpanded((e) => !e)}
            style={local.historyToggle}
          >
            <Text style={local.historyToggleText}>
              {historyExpanded ? 'Hide' : `Show ${analyses.length} past session${analyses.length !== 1 ? 's' : ''}`}
            </Text>
            {historyExpanded ? (
              <ChevronDown size={16} color="#4f7fb2" />
            ) : (
              <ChevronRight size={16} color="#4f7fb2" />
            )}
          </Pressable>
          {historyExpanded
            ? [...analyses].reverse().map((a) => <HistoryRow key={a.id} analysis={a} />)
            : null}
        </GlassCard>
      ) : null}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnalysisResults({ result }: { result: FormAnalysisResult }) {
  return (
    <>
      {/* Score Overview */}
      <View style={local.scoreCard}>
        <View style={local.scoreMain}>
          <Text style={[local.scoreBig, { color: scoreColor(result.overall_score) }]}>
            {result.overall_score}
          </Text>
          <Text style={local.scoreLabel}>/ 100</Text>
        </View>
        <View style={local.scoreMeta}>
          <Text style={local.scoreExercise}>{result.exercise}</Text>
          <Text style={local.scoreConf}>
            {Math.round(result.confidence * 100)}% confidence · {result.rep_count} rep{result.rep_count !== 1 ? 's' : ''} detected
          </Text>
          <Text style={local.scoreTime}>{new Date(result.created_at).toLocaleString()}</Text>
        </View>
      </View>

      {/* Form Issues */}
      {result.form_issues.length > 0 ? (
        <GlassCard title="Form Issues" icon={AlertCircle}>
          <View style={local.issueList}>
            {result.form_issues.map((issue, i) => (
              <View key={i} style={[local.issueCard, { backgroundColor: severityBg(issue.severity) }]}>
                <View style={local.issueHeader}>
                  <View style={[local.severityBadge, { backgroundColor: severityColor(issue.severity) }]}>
                    <Text style={local.severityText}>{issue.severity.toUpperCase()}</Text>
                  </View>
                  {issue.timestamp ? (
                    <Text style={local.issueTimestamp}>{issue.timestamp}</Text>
                  ) : null}
                </View>
                <Text style={[local.issueText, { color: severityColor(issue.severity) }]}>
                  {issue.issue}
                </Text>
                <Text style={local.issueCorrection}>{issue.correction}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      ) : null}

      {/* Positive Points */}
      {result.positive_points.length > 0 ? (
        <GlassCard title="What You Did Well" icon={CheckCircle}>
          <View style={local.bulletList}>
            {result.positive_points.map((p, i) => (
              <View key={i} style={local.bulletRow}>
                <Text style={local.bulletDot}>✓</Text>
                <Text style={local.bulletText}>{p}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      ) : null}

      {/* Coaching Cues */}
      {result.coaching_cues.length > 0 ? (
        <GlassCard title="Coaching Cues" icon={Zap}>
          <View style={local.bulletList}>
            {result.coaching_cues.map((cue, i) => (
              <View key={i} style={local.bulletRow}>
                <Text style={local.cueNumber}>{i + 1}.</Text>
                <Text style={local.bulletText}>{cue}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      ) : null}

      {/* Research Evidence */}
      {result.rag_evidence ? (
        <GlassCard title="Research Evidence" icon={BookOpen}>
          <Text style={local.ragAnswer}>{result.rag_evidence}</Text>
          {result.rag_citations && result.rag_citations.length > 0 ? (
            <View style={local.citationList}>
              {result.rag_citations.map((c, i) => (
                <View key={i} style={local.citationRow}>
                  <Text style={local.citationTitle}>{c.title}</Text>
                  <Text style={local.citationSource}>{c.source}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </GlassCard>
      ) : null}
    </>
  );
}

function HistoryRow({ analysis }: { analysis: FormAnalysisResult }) {
  const criticalCount = analysis.form_issues.filter((i) => i.severity === 'critical').length;
  return (
    <View style={local.historyRow}>
      <View style={[local.historyScore, { backgroundColor: scoreColor(analysis.overall_score) + '22' }]}>
        <Text style={[local.historyScoreNum, { color: scoreColor(analysis.overall_score) }]}>
          {analysis.overall_score}
        </Text>
      </View>
      <View style={local.historyInfo}>
        <Text style={local.historyExercise}>{analysis.exercise}</Text>
        <Text style={local.historyMeta}>
          {new Date(analysis.created_at).toLocaleDateString()} · {analysis.rep_count} reps
          {criticalCount > 0 ? ` · ${criticalCount} critical issue${criticalCount !== 1 ? 's' : ''}` : ''}
        </Text>
      </View>
    </View>
  );
}

// ─── Local styles ─────────────────────────────────────────────────────────────

const local = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    backgroundColor: 'rgba(244,251,255,0.72)',
    padding: 16,
    shadowColor: '#5f7ea7',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  heroEyebrow: {
    color: '#486b99',
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  heroTitle: {
    color: '#1f2e40',
    fontWeight: '900',
    fontSize: 34,
  },
  heroSubtitle: {
    color: '#536b86',
    lineHeight: 21,
    marginTop: 4,
    fontSize: 14,
  },
  captureHint: {
    color: '#6a83a0',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  captureButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  halfBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  cameraCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d2e4f7',
    backgroundColor: '#0a0a0a',
  },
  cameraView: {
    width: '100%',
    height: 280,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  recordBtn: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#c03131',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  recordBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  stopBtn: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  stopBtnText: {
    color: '#c03131',
    fontWeight: '800',
    fontSize: 14,
  },
  cancelBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 13,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#c03131',
  },
  recordingTimer: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  videoReadyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0faf4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#b8e8cb',
    marginBottom: 6,
  },
  videoReadyText: {
    flex: 1,
    color: '#2a7a4b',
    fontWeight: '700',
    fontSize: 13,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c0d8c0',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  clearBtnText: {
    color: '#4d7a5d',
    fontWeight: '700',
    fontSize: 12,
  },
  stepList: {
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepIcon: {
    marginTop: 1,
    width: 20,
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepLabel: {
    color: '#3c5570',
    fontWeight: '700',
    fontSize: 13,
  },
  stepLabelDone: {
    color: '#2a7a4b',
  },
  stepDetail: {
    color: '#6a83a0',
    fontSize: 12,
  },
  stepTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  stepTimestampText: {
    color: '#8fa8c0',
    fontSize: 11,
  },
  errorCard: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#fff0f0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0c0c0',
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: '#c03131',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    backgroundColor: 'rgba(244,251,255,0.82)',
    padding: 16,
    shadowColor: '#5f82ac',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreBig: {
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 60,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#7a90a8',
    fontWeight: '700',
    marginBottom: 6,
  },
  scoreMeta: {
    flex: 1,
    gap: 4,
  },
  scoreExercise: {
    color: '#1f2e40',
    fontWeight: '800',
    fontSize: 16,
  },
  scoreConf: {
    color: '#536b86',
    fontSize: 13,
  },
  scoreTime: {
    color: '#8fa8c0',
    fontSize: 11,
  },
  issueList: {
    gap: 10,
  },
  issueCard: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  severityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  severityText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  issueTimestamp: {
    color: '#8fa8c0',
    fontSize: 11,
  },
  issueText: {
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 19,
  },
  issueCorrection: {
    color: '#4b6078',
    fontSize: 13,
    lineHeight: 18,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: '#2a7a4b',
    fontWeight: '900',
    fontSize: 14,
    lineHeight: 20,
  },
  cueNumber: {
    color: '#4f7fb2',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 20,
    minWidth: 18,
  },
  bulletText: {
    flex: 1,
    color: '#3c5570',
    fontSize: 13,
    lineHeight: 20,
  },
  ragAnswer: {
    color: '#445d78',
    lineHeight: 22,
    fontSize: 13,
    marginBottom: 8,
  },
  citationList: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(171,203,236,0.3)',
    paddingTop: 8,
  },
  citationRow: {
    gap: 2,
  },
  citationTitle: {
    color: '#22364d',
    fontWeight: '700',
    fontSize: 13,
  },
  citationSource: {
    color: '#6483a6',
    fontSize: 11,
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  historyToggleText: {
    color: '#4f7fb2',
    fontWeight: '700',
    fontSize: 13,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(171,203,236,0.25)',
  },
  historyScore: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyScoreNum: {
    fontWeight: '900',
    fontSize: 20,
  },
  historyInfo: {
    flex: 1,
    gap: 3,
  },
  historyExercise: {
    color: '#22364d',
    fontWeight: '800',
    fontSize: 14,
  },
  historyMeta: {
    color: '#6483a6',
    fontSize: 12,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfe2f6',
    backgroundColor: 'rgba(255,255,255,0.78)',
    color: '#203244',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  customConfirmBtn: {
    backgroundColor: '#4f7fb2',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  customConfirmText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
