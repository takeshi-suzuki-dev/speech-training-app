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

- [PoC Spec (EN)](docs/en/poc-spec.md)
- [PoC仕様書 (JP)](docs/jp/Phase0_PoC仕様書.md)

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

---

## Future Plans

- Store results in a database
- Visualize learning progress
- Add feedback generation
- Support free speaking practice

---

## Author

Takeshi Suzuki
