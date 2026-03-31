import { Platform } from 'react-native';
import {
  FileSystemUploadType,
  getInfoAsync,
  uploadAsync,
} from 'expo-file-system/legacy';
import type { FormAnalysisResult } from './geminiClient';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const STORAGE_BUCKET = 'videos';

export function isSupabaseConfigured(): boolean {
  return !!(
    SUPABASE_URL &&
    SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
  );
}

function storagePath(userId: string, exercise: string): string {
  const date = new Date().toISOString().split('T')[0];
  const slug = exercise.toLowerCase().replace(/\s+/g, '_');
  return `${userId}/${date}/${slug}_${Date.now()}.mp4`;
}

export async function uploadVideoToStorage(
  localUri: string,
  userId: string,
  exercise: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const path = storagePath(userId, exercise);
  const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`;
  const authHeaders = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'x-upsert': 'true',
  };

  try {
    if (Platform.OS === 'web') {
      const res = await fetch(localUri);
      const blob = await res.blob();
      const uploadRes = await fetch(url, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'video/mp4' },
        body: blob,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Storage upload failed (${uploadRes.status}): ${err.slice(0, 200)}`);
      }
    } else {
      const fileInfo = await getInfoAsync(localUri);
      if (!fileInfo.exists) throw new Error('Video file not found: ' + localUri);

      const result = await uploadAsync(url, localUri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        headers: { ...authHeaders, 'Content-Type': 'video/mp4' },
      });
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Storage upload failed (${result.status}): ${result.body.slice(0, 200)}`);
      }
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
  } catch (err) {
    console.warn('[supabaseClient] uploadVideoToStorage error:', err);
    return null;
  }
}

export async function saveAnalysisResult(data: FormAnalysisResult): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/media_uploads`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        exercise: data.exercise,
        media_url: data.media_url ?? null,
        ai_result: data,
        confidence: data.confidence,
        overall_score: data.overall_score,
        created_at: data.created_at,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[supabaseClient] saveAnalysisResult failed:', err.slice(0, 200));
      return null;
    }

    const rows = (await res.json()) as Array<{ id: string }>;
    return rows[0]?.id ?? null;
  } catch (err) {
    console.warn('[supabaseClient] saveAnalysisResult error:', err);
    return null;
  }
}
