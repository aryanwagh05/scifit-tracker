# SciFit Tracker
### AI-Powered, Science-Based Fitness Tracking App

Built by the SciFit GatorAI Project Team

---

## Project Vision

SciFit Tracker helps gym-goers train smarter by combining workout tracking, nutrition logging, and AI-driven feedback grounded in exercise science.

---

## The Problem We’re Solving

Most fitness apps:
- Only log data or give generic advice
- Don’t explain why progress stalls
- Don’t connect workouts, nutrition, and recovery
- Don’t use scientific research in a personalized way

SciFit Tracker connects **data + science + AI**.

---

## User Profile & Tracking

### Profile Information
- Age, height, weight
- Goals (hypertrophy, strength, mobility, weight loss/gain)
- Training experience
- Days/week available
- Optional body fat %

### Daily Tracking
- Workout logging (sets, reps, weight, RPE)
- Cardio and steps
- Calories consumed and burned
- Weight trends
- Hydration & electrolytes (optional)

---

## Where AI Is Used

### Multimodal AI Fitness Assistant
- Accepts text, images, and videos
- Form feedback from lifting videos
- Nutrition estimates from meal images

### Research-Grounded AI (RAG)
- Answers questions using curated research
- Prevents hallucinated advice

### Workout Plan Recommendation System
- Generates splits from goals & availability
- Rule-based → ML-assisted

### Progress & Trend Analytics
- Time-series analysis of strength, volume, and calories
- Detects plateaus and recovery issues

---

## Tech Stack

**Frontend**
- React Native

**Backend**
- Supabase (Postgres, Auth, Storage, Edge Functions)

**AI / ML**
- Vision-Language Models (image/video understanding)
- Retrieval-Augmented Generation (RAG)
- Vector embeddings + semantic search
- Rule-based + ML recommendation system
- Time-series analytics

---

## 10-Week Plan

### Stage 0 — Define MVP

We focus only on what is necessary for a working demo.

**MVP Includes:**

- Profile creation
- Workout logging
- Basic nutrition logging (calories + protein)
- Progress analytics (volume, PRs)
- Plan generator v1 (rule-based)
- Static “research cards”

---

### Weeks 1–2: Foundation

- Finalize database schema
- Set up React Native project
- Set up Supabase
- Create static research summaries
- Implement basic workout logging UI

---

### Weeks 3–5: Core Intelligence

- Rule-based workout plan generator
- Progress analytics dashboard
- Implement RAG AI assistant (text only)

---

### Weeks 6–8: Multimodal AI

- Image/video upload support
- AI form feedback for 1–2 exercises
- AI meal image nutrition estimation

---

### Weeks 9–10: Polish & Demo

- UX polish
- Stable demo scenarios
- Documentation and handoff

---

## MVP Deliverable

- Working mobile app
- AI assistant grounded in research
- Workout logging and progress tracking
- At least one AI feature using image/video

---

## Team Goals

- Multimodal AI systems
- RAG pipelines
- Recommendation systems
- Time-series analytics
- Full-stack mobile app development
- Real GitHub collaboration workflow

---

## Knowledge Base Sources

- PubMed research on muscle hypertrophy
- Curated summaries from reputable fitness educators
- Exercise science best practices

---

## Subteam Areas

- Frontend and UX (React Native)
- Backend and Database (Supabase)
- AI Assistant (RAG)
- Multimodal AI (image and video feedback)
- Analytics and Planning (progress and plan logic)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Expo Go](https://expo.dev/go) app on your phone (iOS or Android)
- Python 3.10+ (for the RAG pipeline only)
- A free [Gemini API key](https://aistudio.google.com/app/apikey)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-org/scifit-tracker.git
cd scifit-tracker
```

---

### 2. Set up the mobile app

```bash
cd apps/scifit-app
npm install
```

Create a `.env` file in `apps/scifit-app/`:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Start the dev server:

```bash
npm start
```

Then:
- **Phone:** Open Expo Go → scan the QR code shown in the terminal (must be on the same Wi-Fi)
- **Browser:** Press `w` in the terminal to open the web version

> Code changes hot-reload automatically — you only need to run `npm start` once per session.

---

### 3. RAG pipeline (optional — Python backend)

```bash
cd backend/rag
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Run a question against the research corpus:

```bash
# Mock mode (no API key needed)
make answer q="How many sets per week for hypertrophy?"

# Gemini mode
make answer-gemini q="How many sets per week for hypertrophy?"
```

---

### 4. Supabase edge functions (optional)

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
supabase functions deploy media-analysis
```
