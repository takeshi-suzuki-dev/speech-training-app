# Speech Training App

Turn any sentence you want to master — interview answers, your elevator pitch, tricky phrases — into a personalized pronunciation coach.

The live application is branded "Cadence" in its UI; "Speech Training App" is this repository's project name.

This project started with a Proof of Concept (PoC) to validate pronunciation scoring and sample audio generation, and has since completed Phase 1 (fixed-template MVP) and Phase 2 (authentication and allowlist-gated access).

---

## Overview

This application turns sentences you actually need to say — interview answers, career pitches, or any phrase you want to nail — into targeted pronunciation practice:

- Add your own practice sentences, not just pick from a fixed list
- Auto-generated native-speaker sample audio for every sentence you add (ElevenLabs)
- Word- and phoneme-level pronunciation scoring against your own sentences (Azure AI Speech)
- Preset categories also available for quick practice without any setup
- Score history and trend charts to track improvement over time

---

## Roadmap

This project is developed in phases:

- Phase 0: PoC — completed
- Phase 1: Fixed-template MVP — completed
- Phase 2: Authentication, allowlist-gated access, and user-defined practice sentences — completed
- Phase 3: Plan-based features, billing, multiple sample-audio voice options, and IT engineer vocabulary practice
- Phase 4: Interview FAQ and free-answer practice

For details:

- [Development Roadmap (EN)](docs/en/roadmap.md)
- [開発フェーズ定義 (JP)](docs/jp/開発フェーズ定義.md)
- [Phase 2 Current Status](docs/en/phase-2-current-status.md)
- [Phase 2 Controlled Demo Requirements](docs/en/phase-2-controlled-demo-requirements.md)

---

## PoC Specification

- [PoC Spec (EN)](docs/en/phase0-poc-spec.md)
- [PoC仕様書 (JP)](docs/jp/Phase0_PoC仕様書.md)

## Phase 1 MVP Specification

- [Phase 1 MVP Spec (EN)](docs/en/phase1-mvp-spec.md)
- [Phase 1 MVP Spec (JP)](docs/jp/phase1_MVP仕様書.md)
- [Phase 1 DB / Storage Design (EN)](docs/en/phase1-db-storage-design.md)
- [Phase 1 DB / ストレージ 設計 (JP)](docs/jp/phase1_DB_ストレージ設計書.md)

---

## Tech Stack

### Frontend

- React
- Next.js
- TypeScript
- Tailwind CSS
- Recharts

### Backend

- Java
- Spring Boot
- Spring Data JPA
- PostgreSQL

### AI / Cloud Services

- Azure AI Speech / Pronunciation Assessment
- ElevenLabs Text-to-Speech
- Supabase PostgreSQL
- Supabase Storage

---

## Current Status

### Phase 0 — Completed

The initial PoC verified the core pronunciation assessment flow.

Delivered scope:

- Transcript display
- Overall score display using Azure PronScore
- Sentence-level scores
- Word-level breakdown
- Phoneme-level breakdown
- First and second phoneme candidates with scores
- Raw Azure JSON viewer for development/debugging
- Sample voice playback with a custom audio player
- User-friendly error messages for basic API failures

### Phase 1 — Implementation Completed

Phase 1 turns the PoC into a minimally usable pronunciation training app.

Implemented scope:

- Fixed practice phrase categories loaded from the backend
- Fixed practice phrases loaded by category
- `display_text` used for UI display
- `scoring_text` used for Azure pronunciation assessment
- Browser recording converted to WAV and submitted for scoring
- Pronunciation assessment executed through `POST /api/pronunciation/score`
- Failed or invalid recognition results skipped from history persistence
- Assessment results saved to Supabase PostgreSQL
- Roger sample audio generated through `POST /api/sentence-templates/{templateId}/sample-audio`
- Generated sample audio stored in Supabase Storage and reused through public URLs
- Latest score for each sentence fetched through `GET /api/sentence-latest-scores`
- History trend data fetched through `GET /api/training-attempts/history-trends`
- Overall score trend chart implemented
- Daily last-5 average, 5-practice-day moving average, and 20-practice-day moving average displayed
- Score breakdown trend chart implemented for overall, accuracy, fluency, completeness, and prosody
- Practice and History screens connected through shared navigation
- Frontend configuration such as `API_BASE_URL` centralized under `frontend/src/lib/config.ts`
- Backend project directory flattened to `backend/`

### Phase 2 — Authentication, Allowlist-Gated Access, and User-defined Practice Sentences — Completed

This phase introduced Firebase / Google authentication, an application-level allowlist, user-defined categories, user-defined sentence templates, favorites, and a landing page with a trial access request flow.

The goal was not to launch the app as a public SaaS. The goal was to make it safe enough to use as a controlled portfolio demo for recruiters. That goal has been met.

Implemented scope:

- Firebase / Google authentication
- Application-level allowlist (`app_allowed_users`), enforced globally on all protected backend APIs via `FirebaseAuthenticationInterceptor`
- 401 for unauthenticated requests, 403 for authenticated-but-not-allowed requests (not on the allowlist, inactive, expired, or Firebase UID mismatch)
- User-defined categories and practice sentences, scoped to the owner's Firebase UID
- Favorite templates
- Frontend API client that attaches Firebase ID tokens to every backend request
- Clear unauthorized / forbidden UI states, showing the backend's own denial message
- Landing page with a trial access request form
- Account menu (signed-in email + logout) in the app header

Remaining before broader use (tracked for Phase 3, see below):

- Production CORS configuration (currently allows `http://localhost:3000` only)
- Multiple sample-audio voice options (implemented at the database/design level; not yet exposed via API or UI)

For details:

- [Phase 2 Current Status](docs/en/phase-2-current-status.md)
- [Phase 2 Controlled Demo Requirements](docs/en/phase-2-controlled-demo-requirements.md)

---

## Future Plans

### Phase 3 — Plan-based Features, Billing, Multiple Sample-Audio Voices, and IT Engineer Vocabulary Practice

Phase 3 introduces monetization and plan-based feature control.

Planned scope:

- Multiple sample-audio voice options (already implemented at the database/design level; exposing via API and UI is deferred to this phase)
- Free / Basic / Plus / Pro plan design
- Billing system integration
- Subscription status management
- Plan-based feature access
- Daily scoring limits by plan
- User-defined sentence features as upper-plan value
- User-defined sample audio generation as upper-plan value
- User-defined sentence scoring and history as upper-plan value
- IT engineer vocabulary practice
- Fixed-template practice and vocabulary practice as trial or lower-plan features
- Transparent plan boundaries and pricing

### Phase 4 — Interview FAQ and Free-answer Practice

Phase 4 expands the app beyond fixed sentence practice.

Planned scope:

- Interview FAQ practice
- Question prompts
- Question audio
- User answer text
- Sample audio generation for user answers
- Pronunciation scoring for user answers
- History for interview-answer practice
- Later free speaking mode

---

## Author

Takeshi Suzuki
