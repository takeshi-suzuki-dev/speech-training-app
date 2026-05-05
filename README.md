# Speech Training App

A pronunciation training application for English learners using Azure AI and ElevenLabs.

This project starts with a Proof of Concept (PoC) to validate speech scoring and audio generation, and gradually evolves into a full learning application.

---

## Overview

This application helps English learners improve their pronunciation through:

- Speech recording and pronunciation assessment (Azure AI)
- Sample audio generation (ElevenLabs)
- Visual feedback and progress tracking (planned)

---

## Roadmap

This project is developed in phases:

- Phase 0: PoC (technical validation)
- Phase 1: MVP (minimum usable product)
- Phase 2: Release v1.0 (learning experience enhancement)
- Phase 3: Release v2.0 (free speaking support)

For details:

- [Development Roadmap (EN)](docs/en/roadmap.md)
- [開発フェーズ定義 (JP)](docs/jp/開発フェーズ定義.md)

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

### Backend

- Java
- Spring Boot

### AI Services

- Azure AI (Speech / Pronunciation Assessment)
- ElevenLabs (Text-to-Speech)

---

## Current Status

### Phase 0 — Completed

- Azure Speech pronunciation assessment API integrated in backend
- ElevenLabs TTS API integrated for sample voice generation
- Sample voice playback implemented in frontend
- Key pronunciation assessment fields displayed in frontend
- Word-level and phoneme-level response mapping implemented
- Raw Azure JSON viewer implemented
- Basic error handling implemented for Azure Speech and ElevenLabs

PoC scope delivered:

- transcript display
- overall score display using Azure PronScore
- sentence-level scores
- word-level breakdown
- phoneme-level breakdown
- first / second phoneme candidates with scores
- raw Azure JSON viewer
- sample voice playback with a custom audio player
- user-friendly error messages for basic API failures

### Phase 1 — In Progress

Phase 1 is currently focused on turning the PoC into a minimally usable pronunciation training app.

Implemented so far:

- Fixed practice phrase categories are loaded from the backend
- Fixed practice phrases are loaded by category
- The frontend uses `display_text` for UI display and `scoring_text` for Azure pronunciation assessment
- Browser recording is converted to WAV and submitted for scoring
- Pronunciation assessment results are saved to Supabase PostgreSQL
- Roger sample audio is generated through `POST /api/sentence-templates/{templateId}/sample-audio`
- Generated sample audio is stored in Supabase Storage and reused through public URLs
- The latest score for each sentence is fetched through `GET /api/sentence-latest-scores`
- Frontend configuration such as `API_BASE_URL` is centralized under `frontend/src/lib/config.ts`
- Backend project directory has been flattened to `backend/`

Next implementation target:

- Dedicated history screen
- Basic assessment history list
- Simple score trend visualization

---

## Future Plans

- Build a dedicated history screen
- Visualize learning progress
- Add moving averages and simple trend charts
- Add feedback generation
- Support user-defined practice phrases
- Support free speaking practice in a later phase

---

## Author

Takeshi Suzuki
