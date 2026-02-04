# SciFit Tracker
### AI-Powered, Science-Based Fitness Tracking App

Built by the SciFit GatorAI Project Team

---

## 🧠 Project Vision

SciFit Tracker helps gym-goers train smarter by combining workout tracking, nutrition logging, and AI-driven feedback grounded in exercise science.

---

## ❗ The Problem We’re Solving

Most fitness apps:
- Only log data or give generic advice
- Don’t explain why progress stalls
- Don’t connect workouts, nutrition, and recovery
- Don’t use scientific research in a personalized way

SciFit Tracker connects **data + science + AI**.

---

## 👤 User Profile & Tracking

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

## 🤖 Where AI Is Used

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

## 🛠 Tech Stack

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

## 🚀 Roadmap (10-Week Plan)

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

## ✅ MVP Deliverable

By end of semester we will have:

- Working mobile app
- AI assistant grounded in research
- Workout logging and progress tracking
- At least one AI feature using image/video

---

## 🎯 Team Goals

This project is designed to give members experience with:

- Multimodal AI systems
- RAG pipelines
- Recommendation systems
- Time-series analytics
- Full-stack mobile app development
- Real GitHub collaboration workflow

---

## 📚 Knowledge Base Sources

- PubMed research on muscle hypertrophy
- Curated summaries from reputable fitness educators
- Exercise science best practices

---

## 🧭 Guiding Principle

> Start simple. Ship the MVP. Then improve.

We prioritize working systems over overengineering.

---

## 👥 Subteam Areas (parallel work)

- Frontend and UX (React Native)
- Backend and Database (Supabase)
- AI Assistant (RAG)
- Multimodal AI (image and video feedback)
- Analytics and Planning (progress and plan logic)
