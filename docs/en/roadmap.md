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
- Start/stop recording
- Send audio and text to Azure AI
- Retrieve evaluation results

Displayed data:

- Overall score
- Category scores (e.g., fluency)
- Word-level scores
- Phoneme-level scores
- First detected candidate for each phoneme
- Full Azure API response (raw response)

---

#### ElevenLabs (Text-to-Speech)

- Call the API only when the "Generate Sample Audio" button is pressed
- Retrieve generated sample audio
- Play audio via the "Play Sample Audio" button
- Display ElevenLabs API response (excluding audio binary data)

---

### Out of Scope

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
  - category
  - word
  - phoneme
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
