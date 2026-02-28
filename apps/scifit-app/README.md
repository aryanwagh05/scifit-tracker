# SciFit App (Expo + Tamagui)

Prototype mobile app for the SciFit Tracker project. The current app is a front-end demo shell with local navigation state, placeholder workout/profile flows, and an RAG client that can be wired to a Supabase Edge Function.

## Structure

- `src/app`: app shell and routing state
- `src/features`: feature modules (auth, profile, workout, rag, coach, navigation)
- `src/shared`: shared UI primitives and styles
- `src/services`: API clients

## Quality Checks

- `npm run typecheck`
- `npm run check`

## Scripts

- `npm run start`
- `npm run ios`
- `npm run android`
- `npm run web`
- `npm run typecheck`
- `npm run check`

## Environment

Copy `.env.example` to `.env` and set:

- `EXPO_PUBLIC_RAG_API_URL`
- `EXPO_PUBLIC_RAG_API_KEY` (optional if endpoint does not require auth)

## Notes

- Camera coaching is a simulated flow today; permission handling and preview wiring are present, but no inference pipeline runs on-device.
- Authentication and profile persistence are not implemented yet; current screens are local-state MVP placeholders.
