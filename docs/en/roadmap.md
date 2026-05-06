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

## Phase 2: User-defined Practice Phrases / Learning Experience Enhancement

### Goal

Allow users to create their own practice material and improve the learning experience.

### Scope

- User-defined practice phrases
- User-defined categories if needed
- Sample audio generation for user-defined phrases
- Extended reference audio management
- History filtering by sentence/category/date range
- More detailed trend analysis
- Weakness analysis
- Advice based on assessment results
- Authentication design and implementation if needed
- Protected audio delivery if user-specific audio becomes sensitive

---

## Phase 3: Free Speaking Support

### Goal

Support freer speaking practice beyond fixed templates.

### Scope

- Free speaking mode
- Interview-answer practice mode
- User-configured answer text
- Question audio and answer sample audio
- More flexible scoring and review flows
- Plan-based usage limits if monetization is introduced

---

## Out of Scope for the Current Phase

- Full production monetization
- Large-scale user management
- Multi-language expansion
- Japanese-learning support
