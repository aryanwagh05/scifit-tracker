# SciFit App (Expo + Tamagui)

AI-powered fitness tracking app with multimodal form analysis, research-grounded coaching, and Supabase-backed persistence.

## Features

| Tab | Description |
|-----|-------------|
| Home | Dashboard with metrics and quick-launch buttons |
| Login | Email/password auth (UI only — backend not wired yet) |
| Profile | Height, weight, goal, training days |
| Workout | Session log + form analysis history grouped by exercise |
| Coach | **AI Form Analysis** — record or upload a set, get real-time pose feedback backed by research |

### Coach Tab flow

1. Pick an exercise (Back Squat, Bench Press, Deadlift, OHP, Barbell Row)
2. Record a set via the in-app camera (up to 90 s) or pick a video from your library
3. Tap **Analyze Form**
4. Watch the step-by-step pipeline with live timestamps:
   - Upload to Supabase Storage
   - Gemini `gemini-flash-latest` form analysis
   - RAG research evidence fetch
   - Save result to `media_uploads` table
5. Results show: score /100, confidence %, form issues with severity + corrections, positive points, coaching cues, and research citations
6. All sessions appear in the **Workout** tab grouped by exercise with trend arrows

---

## Project Structure

```
src/
  app/           # App shell, routing, navigation types
  features/
    auth/        # Login screen
    coach/       # AIAnalysisPage (unified coach + RAG + video)
    dashboard/   # Home screen
    navigation/  # BottomNav (5 tabs)
    profile/     # Profile form
    workout/     # Workout log + analysis history
  services/
    geminiClient.ts    # Gemini multimodal + form analysis
    ragClient.ts       # RAG evidence engine
    supabaseClient.ts  # Storage upload + DB insert (REST, no SDK)
  shared/
    ui/          # GlassCard, Metric, InfoRow atoms + styles
```

---

## Prerequisites

- **Node.js** v18+
- **Expo Go** on your phone, or a simulator/emulator
- A **Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## Quick Start

```bash
# 1. Install dependencies
cd apps/scifit-app
npm install

# 2. Set up environment variables (see below)
cp .env.example .env
# then edit .env with your keys

# 3. Start the dev server
npm start
```

After `npm start`:

| Target | How |
|--------|-----|
| **Web** | Press `w` in the terminal |
| **Android** | Press `a` (Android emulator must be running), or scan the QR code in Expo Go |
| **iOS** | Press `i` (Xcode simulator), or scan the QR code in Expo Go |
| **Physical device** | Open Expo Go → scan the QR code (same Wi-Fi required) |

Hot reload is on by default — no restart needed for most code changes.

---

## Environment Variables

Edit `apps/scifit-app/.env`:

```env
# Required — Gemini form analysis and media processing
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional — Supabase persistence (video storage + analysis history)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Optional — RAG research evidence (Supabase Edge Function)
EXPO_PUBLIC_RAG_API_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1/rag-chat
EXPO_PUBLIC_RAG_API_KEY=YOUR_SUPABASE_ANON_KEY
```

The app runs without Supabase — analysis results are kept in memory for the session. Only `EXPO_PUBLIC_GEMINI_API_KEY` is required for full AI functionality.

---

## Configuring Full Persistence (Supabase)

Without Supabase the Coach tab still does full Gemini analysis — results just don't survive an app restart. To persist videos and analysis history:

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, and copy your **Project URL** and **anon public key** from **Settings → API**.

### 2. Create the `videos` storage bucket

In the Supabase dashboard:

1. Go to **Storage → New bucket**
2. Name it `videos`
3. Set it to **Public** (so the app can generate a public URL after upload)

### 3. Create the `media_uploads` table

Run this in **SQL Editor → New query**:

```sql
create table media_uploads (
  id           uuid primary key default gen_random_uuid(),
  exercise     text not null,
  media_url    text,
  ai_result    jsonb,
  confidence   float,
  overall_score int,
  created_at   timestamptz default now()
);

-- Allow the anon key to insert and read
alter table media_uploads enable row level security;

create policy "anon insert" on media_uploads
  for insert to anon with check (true);

create policy "anon select" on media_uploads
  for select to anon using (true);
```

### 4. Fill in your .env

```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart `npm start` after editing `.env`.

### 5. (Optional) Wire up the RAG edge function

If you want research citations to appear alongside form feedback, deploy the RAG edge function from `backend/supabase/functions/` and set `EXPO_PUBLIC_RAG_API_URL`.

---

## Available Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Open iOS simulator
npm run android    # Open Android emulator
npm run web        # Open browser
npm run typecheck  # TypeScript type check
npm run check      # Lint + type check
```

---

## Notes

- Camera recording requires a physical device or emulator with camera support — not available in the web build.
- Videos up to 90 seconds are accepted by the Gemini Files API.
- Gemini free tier has rate limits; if you hit a 429 error, wait ~60 seconds and retry or enable billing in Google Cloud.
- Auth and profile persistence are UI placeholders — Supabase Auth is not wired yet.
