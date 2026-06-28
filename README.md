# Speech Training App

A pronunciation training application for English learners using Azure AI Speech and ElevenLabs.

This project started with a Proof of Concept (PoC) to validate pronunciation scoring and sample audio generation, and has now reached the Phase 1 MVP implementation.

---

## Overview

This application helps English learners improve their pronunciation through:

- Speech recording and pronunciation assessment using Azure AI Speech
- Template-based sample audio generation using ElevenLabs
- Fixed practice phrase selection by category
- Saved pronunciation assessment results
- Latest score display for each practice sentence
- Daily score trend charts and moving averages

---

## Roadmap

This project is developed in phases:

- Phase 0: PoC — completed
- Phase 1: Fixed-template MVP — completed
- Phase 2: Authentication and user-defined practice sentences — in progress
- Phase 2.1: Controlled portfolio demo access — in progress
- Phase 3: Plan-based features, billing, and IT engineer vocabulary practice
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

## Current Phase

### Phase 2 — Authentication, User-defined Practice Sentences, and Controlled Demo Access

Phase 2 is currently in progress on the `feature/auth-user-templates` branch.

This phase introduces Firebase / Google authentication, user-defined categories, user-defined sentence templates, favorites, and Firebase UID based ownership for some user-defined data.

The current goal is not to launch the app as a public SaaS. The goal is to make it safe enough to use as a controlled portfolio demo for recruiters.

Implemented or partially implemented scope:

- Firebase / Google authentication
- User-defined categories
- User-defined practice sentences
- Favorite templates
- Firebase UID based ownership for some user-defined data

Remaining scope before controlled recruiter demo:

- Consistent authentication for protected backend APIs
- Application-level allowlist for live app access
- Access control for user-specific templates and audio
- Protected handling for user-defined sample audio
- Frontend API calls with Firebase ID tokens
- Clear unauthorized / forbidden UI states
- Production CORS configuration

For details:

- [Phase 2 Current Status](docs/phase-2-current-status.md)
- [Phase 2 Controlled Demo Requirements](docs/phase-2-controlled-demo-requirements.md)

---

## Future Plans

### Phase 3 — Plan-based Features, Billing, and IT Engineer Vocabulary Practice

Phase 3 introduces monetization and plan-based feature control.

Planned scope:

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
