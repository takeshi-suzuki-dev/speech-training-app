# Development Roadmap

## Phase 0: PoC — Completed

### Goal

Validate the technical feasibility of the core pronunciation training flow.

### Delivered Scope

- Azure AI Speech pronunciation assessment integration
- ElevenLabs TTS integration
- Transcript display
- Overall score display using Azure PronScore
- Sentence-level scores
- Word-level breakdown
- Phoneme-level breakdown
- First and second phoneme candidates with scores
- Raw Azure JSON viewer for development/debugging
- Sample voice playback
- Basic API error handling

---

## Phase 1: MVP Implementation — Completed

### Goal

Turn the PoC into a minimally usable pronunciation training app.

### Delivered Scope

- Fixed practice phrase categories
- Fixed practice phrases by category
- Template-based practice flow
- `display_text`, `scoring_text`, and `sample_audio_text` separation
- Roger fixed sample audio
- Minimal TTS cache using Supabase Storage
- Azure AI Speech pronunciation assessment
- Valid assessment result persistence to `training_attempts`
- Skipping failed or invalid recognition results from history persistence
- Latest score display by sentence
- Dedicated history screen
- Overall Pron trend chart
- Daily last-5 average
- 5-practice-day moving average
- 20-practice-day moving average
- Score breakdown trend chart for overall, accuracy, fluency, completeness, and prosody
- Practice / History navigation
- README and docs update

### Key Design Decisions

- No full authentication in Phase 1
- Browser-local `client_id` is used for history
- User-recorded audio is not saved
- Reference audio only is stored
- Public URLs are used for fixed shared reference audio
- Free-text TTS is not part of the Phase 1 user-facing flow

---

## Phase 2: Authentication and User-defined Practice Sentences — Completed

### Goal

Allow authenticated users to safely create and practice their own sentences.

User-defined practice sentences may contain private career history, interview answers, portfolio explanations, relocation reasons, and other personal learning material. For that reason, Phase 2 is designed on the assumption that user-defined templates and related audio are available only after login.

### Scope

- Login / authentication
- User management
- Authenticated `user_id`
- User-owned practice sentences
- User-owned categories if needed
- Create / edit / delete user-defined practice sentences
- Sample audio generation for user-defined sentences
- Pronunciation scoring for user-defined sentences
- User-specific history
- Access control for user-specific data
- Protected handling of user-specific sample audio
- Private bucket, signed URL, or backend-mediated audio delivery if needed

### Out of Scope

- Billing system
- Plan-based feature restrictions
- Free-answer / interview FAQ practice
- Full monetization workflow

### Goal State

Users can log in and safely practice with their own private interview answers and career-related sentences.

---

## Phase 3: Plan-based Features, Billing, and IT Engineer Vocabulary Practice

### Goal

Introduce monetization, plan-based feature access, and additional practice value for IT engineers.

Phase 3 defines which features belong to lower plans and which features become upper-plan value.

### Scope

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

### Example Plan Direction

Lower plans may focus on:

- Fixed practice sentences
- IT engineer vocabulary practice
- Limited scoring attempts
- Basic history

Upper plans may include:

- User-defined practice sentences
- User-defined sample audio generation
- Pronunciation scoring for user-defined sentences
- More scoring attempts
- Interview-oriented practice value

### Goal State

The app has clear plan boundaries, billing, and a sustainable paid value proposition.

---

## Phase 4: Interview FAQ and Free-answer Practice

### Goal

Expand from sentence practice into interview question and free-answer practice.

Phase 4 focuses on practicing answers to prompts rather than only repeating predefined sentences.

### Scope

- Interview FAQ practice
- Question prompts
- Question audio
- User answer text
- Sample audio generation for user answers
- Pronunciation scoring for user answers
- History for interview-answer practice
- Later free speaking mode

### Example Flow

1. User chooses an interview question.
2. User registers their own answer text.
3. App plays question audio.
4. App generates sample answer audio.
5. User records their answer.
6. App scores pronunciation and stores progress.

### Goal State

Users can practice personalized interview answers and gradually move toward freer speaking.

---

## Overall Flow

| Phase   | Focus                                                           |
| ------- | --------------------------------------------------------------- |
| Phase 0 | Validate feasibility                                            |
| Phase 1 | Make fixed-template practice usable                             |
| Phase 2 | Add authentication and private user-defined practice            |
| Phase 3 | Add plan-based monetization and IT engineer vocabulary practice |
| Phase 4 | Add interview FAQ and free-answer practice                      |

---

## Design Intent

- Validate external dependencies first
- Keep Phase 1 focused on the core scoring loop
- Introduce authentication before handling private user-defined material
- Treat user-defined sentence practice as a high-value feature
- Add plan and billing only after the authenticated user flow exists
- Defer free-answer practice until the fixed and user-defined template flows are stable
