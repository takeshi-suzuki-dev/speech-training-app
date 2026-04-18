# Development Phases

This project is developed in four phases:

- **Phase 0**: PoC (Proof of Concept)
- **Phase 1**: MVP (Minimum Viable Product)
- **Phase 2**: Release v1.0 (Enhancing Learning Value)
- **Phase 3**: Release v2.0 (Free Speaking Support)

---

## Phase 0: PoC (Proof of Concept)

### Objective

- Validate whether the core features are technically feasible
- Verify integration with external APIs (Azure AI / ElevenLabs)

---

### Scope

#### Azure AI (Pronunciation Assessment)

- Display a fixed practice sentence
- Select an audio file
- Send audio and text to Azure AI
- Retrieve evaluation results

Displayed data:

- Overall score
- Sentence-level scores
- Word-level scores
- Phoneme-level scores
- First and second detected candidates for each phoneme
- Candidate scores for detected phoneme candidates
- Full Azure API response (raw response)

---

#### ElevenLabs (Text-to-Speech)

- Call the API only when the "Generate Sample Audio" button is pressed
- Retrieve generated sample audio
- Play audio via the "Play Sample Audio" button
- Display ElevenLabs API response (excluding audio binary data)

---

### Out of Scope

- Browser recording
- WAV generation
- Database integration
- Feedback generation
- UI/UX optimization
- Learning features

---

### Success Criteria

- Audio can be sent successfully
- Azure AI returns evaluation results
- All score levels can be retrieved:
  - overall
  - sentence-level
  - word
  - phoneme candidates with scores
- Raw Azure response can be inspected
- ElevenLabs successfully generates audio
- Generated audio can be played back
- Raw ElevenLabs response can be inspected

---

## Phase 1: MVP (Minimum Viable Product)

### Objective

Turn the PoC into a minimally usable product.

---

### Scope

- Store evaluation results in a database
- Manage multiple practice sentences (DB)
- Display evaluation results in a well-organized single screen
- Add a simple login screen (if needed)
- Switch result display based on Azure `RecognitionStatus`

---

### Goal

A minimally usable pronunciation training application.

---

## Phase 2: Release v1.0 (Enhancing Learning Value)

### Objective

Enhance learning experience and enable continuous usage.

---

### Scope

- Retrieve evaluation history from the database
- Visualize progress using line charts and bar charts
- Provide advice based on evaluation results
- Allow users to add custom practice sentences
- Generate sample audio using ElevenLabs and store it in the database
- Add recording-time audio level detection and pre-submit checks

---

### Goal

A practical application that supports continuous learning.

---

## Phase 3: Release v2.0 (Free Speaking Support)

### Objective

Extend from fixed-sentence practice to free speaking.

---

### Scope

- Add a themed free-response feature (within 2 minutes)
- Extend the flow: recording → scoring → evaluation display
- Decide UI integration (same screen or separate screen) before implementation

---

### Goal

An application that enables practical speaking practice.

---

## Overall Flow

| Phase   | Focus                |
| ------- | -------------------- |
| Phase 0 | Validate feasibility |
| Phase 1 | Make it usable       |
| Phase 2 | Make it sustainable  |
| Phase 3 | Make it practical    |

---

## Design Intent

- Validate external dependencies (Azure / ElevenLabs) first
- Avoid over-engineering in the MVP phase
- Gradually increase learning value
- Defer complex features (free speaking) to later phases
