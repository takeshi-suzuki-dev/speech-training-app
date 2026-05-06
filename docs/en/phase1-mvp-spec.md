# Phase 1 MVP Spec

## 1. Purpose

This document defines the Phase 1 MVP specification for the pronunciation training app.

The purpose of Phase 1 is to turn the PoC-validated technical components into a minimally usable pronunciation training application.

Phase 1 is considered complete when the app can:

- Let users choose fixed practice sentences
- Play sample audio
- Submit recorded speech
- Display Azure AI Speech pronunciation assessment results
- Save valid assessment results to the database
- Show the latest score for each sentence
- Show history trend charts
- Be explained through README, docs, and an English portfolio explanation

---

## 2. Position of Phase 1

Phase 1 is the MVP.

The PoC validated Azure AI Speech and ElevenLabs integration.  
Phase 1 organizes those technical components into a usable app.

Phase 1 is not the final product.  
Full authentication, user-defined phrases, full audio management, detailed analysis, and generated advice are deferred to later phases.

---

## 3. Scope

### In Scope

- Fixed practice phrase categories
- Fixed practice phrases
- Practice phrase selection
- Separation of `display_text`, `scoring_text`, and `sample_audio_text`
- Roger sample audio playback
- Minimal TTS caching for generated sample audio
- Supabase Storage persistence for sample audio
- Azure AI Speech pronunciation assessment
- Pronunciation assessment result display
- Database persistence for valid assessment results
- Skipping failed or invalid recognition results from history persistence
- Browser-local `client_id` for simple user identification
- Latest score display by sentence
- History trend screen
- Overall Pron trend chart
- Daily last-5 average, 5-practice-day moving average, and 20-practice-day moving average
- Score breakdown trend chart
- README and docs update
- Interview-ready English explanation

### Out of Scope

- Full authentication
- Cross-device synchronization
- User-defined practice phrases
- User-recorded audio persistence
- Voice selection UI
- Multiple sample voice switching such as Sarah
- Regeneration UI
- Speed control
- Audio management screen
- Date range filters
- Sentence/category filters
- Weakness analysis
- Advanced advice generation
- Protected delivery for user-specific audio
- Backend proxy for audio playback
- Free-text TTS API as a user-facing Phase 1 flow

---

## 4. User Identification

Phase 1 does not include full authentication.

Instead, it uses a browser-local `client_id` to connect assessment history to the current browser.

On first access, the frontend generates a UUID and saves it in localStorage.

### Policy

- `client_id` is a browser-local identifier
- `user_id` is kept for future authenticated users
- History can be linked within the same browser
- Cross-browser and cross-device synchronization is not supported
- Authentication is deferred to a later phase

### Interview Explanation

> Phase 1 does not include full authentication.  
> Instead, I use a browser-local client ID to keep user history with minimal complexity.  
> This allowed me to focus on the core scoring feedback loop first, while keeping the design flexible enough to add authentication later.

---

## 5. Fixed Practice Sentences

Phase 1 does not include user-defined sentence creation.

The app manages fixed practice sentences by category, and users choose from those sentences.

### Requirements

- Store fixed practice phrase categories in the database
- Store fixed practice phrases in the database
- Fetch templates by category
- Maintain display order
- Support active/inactive records
- Allow users to select a sentence
- Use `display_text` for UI display
- Use `scoring_text` for Azure pronunciation assessment
- Use `sample_audio_text` for ElevenLabs sample audio generation

### Deferred to Phase 2 or Later

- User-defined phrase creation
- User-defined phrase editing
- User-defined phrase deletion
- Audio management for user-defined phrases
- User-specific categories/templates

---

## 6. Sample Audio

Phase 1 provides Roger sample audio for fixed practice sentences.

### UI Image

```text
Practice phrase

[ Play sample · Roger ]
```

Users can play the Roger sample audio for the selected practice sentence.

### Policy

- Roger is fixed in Phase 1
- No voice selection UI
- No multiple voice switching such as Sarah
- No speed control
- No regeneration button
- Sample audio is stored in Supabase Storage
- Frontend plays the public URL directly
- Backend proxy is not used in Phase 1

### TTS Cache

- Sample audio is generated or reused through `POST /api/sentence-templates/{templateId}/sample-audio`
- If `audio_path` already exists, the backend returns the public URL for the stored MP3
- If `audio_path` does not exist, the backend generates audio through ElevenLabs and uploads it to Supabase Storage
- Generated MP3 files are reused
- ElevenLabs is not called on every playback

### Deferred

- Sarah support
- Voice selection
- Regeneration UI
- Audio management screen
- Audio management for user-defined phrases
- Backend proxy / signed URLs

---

## 7. Pronunciation Assessment

Phase 1 uses Azure AI Speech for pronunciation assessment.

### Input

- Reference/scoring text
- User speech audio

When a fixed sentence is selected, the frontend uses `scoring_text` for assessment.

### Output

- Recognized text
- Recognition status
- Overall / Pron score
- Accuracy score
- Fluency score
- Completeness score
- Prosody score
- Word-level details
- Phoneme-level details
- Phoneme candidates

### Display Policy

Phase 1 organizes assessment results into a readable single screen.

At minimum, the screen displays:

- Recognized text
- Overall score
- Accuracy / fluency / completeness / prosody
- Word-level assessment
- Phoneme details for selected words
- User-friendly error state

The raw Azure JSON viewer used in the PoC is treated as a development/debugging tool and is not a core Phase 1 UI requirement.

---

## 8. Assessment Result Persistence

Assessment results are saved to `training_attempts` in Supabase PostgreSQL.

Main stored fields:

- `client_id`
- `user_id`
- `mode`
- `sentence_id`
- `reference_text`
- `recognized_text`
- `overall_score`
- `accuracy_score`
- `fluency_score`
- `completeness_score`
- `prosody_score`
- `words_json`
- `audio_duration_ms`
- `scored_at`
- `created_at`

`words_json` stores word-level and phoneme-level details returned by Azure Speech.

Phase 1 does not store user-recorded audio files.  
Persisting the full raw Azure JSON is not a required Phase 1 feature.

### Not Saved

The backend does not save a training attempt when:

- `RecognitionStatus` is not `Success`
- Sentence-level scores are missing
- PronScore / overall is missing
- PronScore / overall is 0 or lower

This prevents failed recognition results from polluting the history charts.

---

## 9. History Screen

Phase 1 includes a dedicated history screen.

### Screen Structure

The history screen has two tabs:

- Overall
- Score Breakdown

Both tabs use data from `GET /api/training-attempts/history-trends`.

### Overall Tab

The Overall tab shows the trend for the overall Pron score.

Lines displayed:

- Daily last-5 average
- 5-practice-day moving average
- 20-practice-day moving average

Aggregation rules:

- Target period is the last year
- `scored_at` is converted to a practice date using `Asia/Tokyo`
- For each day, the latest five attempts are used
- If a day has fewer than five attempts, all attempts for that day are used
- 5-day and 20-day moving averages are calculated from the daily averages

Supporting display:

- If the latest daily average is the all-time best, show a high-score message
- If the latest daily average is second best, show a second-best message
- If the latest daily average is third best, show a third-best message
- If the latest daily average is greater than or equal to the 5-day moving average, show a positive condition message
- If the 5-day moving average is greater than or equal to the 20-day moving average, visually highlight the chart background

### Score Breakdown Tab

The Score Breakdown tab shows trends for sentence-level score items.

Lines displayed:

- Overall / Pron
- Accuracy
- Fluency
- Completeness
- Prosody

Aggregation rules:

- Each line shows the daily last-5 average for that score item
- 5-day and 20-day moving averages are not shown in this tab

### Deferred

- Date range filters
- Sentence/category filters
- Configurable long-term averages
- Weakness analysis
- Advice generation

---

## 10. Current Implementation Status

Phase 1 implementation is complete.

Implemented:

- Fixed practice phrase categories are loaded from the backend
- Fixed practice phrases are loaded by category
- `display_text` is used for UI display
- `scoring_text` is used for Azure assessment
- Browser recording is converted to WAV and submitted for scoring
- Pronunciation assessment runs through `POST /api/pronunciation/score`
- Failed or invalid recognition results are not saved to `training_attempts`
- Valid assessment results are saved to `training_attempts`
- Roger sample audio is generated or reused through `POST /api/sentence-templates/{templateId}/sample-audio`
- Generated sample audio is stored in Supabase Storage
- Existing sample audio is reused through public URLs
- Latest score by sentence is fetched through `GET /api/sentence-latest-scores`
- The practice screen shows the latest score for each fixed sentence
- The history screen fetches chart data from `GET /api/training-attempts/history-trends`
- Overall trend chart is implemented
- Score breakdown trend chart is implemented
- Practice and History screens are connected through shared navigation
- Backend project directory has been flattened to `backend/`

---

## 11. API Requirements

Phase 1 currently uses the following APIs.

### Practice Phrases

```text
GET /api/sentence-categories
GET /api/sentence-templates?categoryId={categoryId}
```

Fetch fixed practice phrase categories and templates.

### Pronunciation Assessment

```text
POST /api/pronunciation/score
```

Submit user speech audio and run Azure AI Speech pronunciation assessment.

The backend saves the result to `training_attempts` only when recognition and scoring are valid.

### Latest Score by Sentence

```text
GET /api/sentence-latest-scores?clientId={clientId}
```

Fetch the latest assessment result for each sentence.

This is used by the pronunciation practice page to show the latest score for each fixed practice sentence.

### History Trends

```text
GET /api/training-attempts/history-trends?clientId={clientId}
```

Fetch daily aggregated data for history charts.

The response includes:

- Practice date
- Daily last-5 average overall
- Daily last-5 average accuracy
- Daily last-5 average fluency
- Daily last-5 average completeness
- Daily last-5 average prosody
- 5-practice-day moving average for overall
- 20-practice-day moving average for overall

### Reference Audio Generation

```text
POST /api/sentence-templates/{templateId}/sample-audio
```

Generate or reuse Roger sample audio for a fixed practice sentence.

Frontend sends only the template ID.

The backend derives:

- Sample audio text
- ElevenLabs voice ID
- Model ID
- Storage path

---

## 12. DB / Storage

Detailed DB and Storage design is defined in:

```text
docs/en/phase1-db-storage-design.md
docs/jp/phase1-db-storage-design.md
```

Basic Phase 1 policy:

- DB: Supabase PostgreSQL
- Storage: Supabase Storage
- Storage bucket: `reference-audio`
- Bucket access: Public
- Sample audio path: `preset/{sentence_template_id}/roger.mp3`
- Sample audio metadata is managed by `sentence_template_audios`
- Assessment results are managed by `training_attempts`
- `audio_assets` table is not created in Phase 1

---

## 13. Error Handling

### Azure AI Speech

- Display results based on `RecognitionStatus`
- Show user-friendly messages for NoMatch / timeout / error cases
- Do not save failed or invalid recognition results to history
- Log unexpected backend errors
- Treat raw JSON as development/debugging data when needed

### ElevenLabs

- Show an error when generation fails
- Do not save broken audio files
- Retry generation on next playback when `audio_path` is missing

### Supabase Storage

- Return an error when upload fails
- If public URL playback fails, call the backend generation API again

---

## 14. Security Policy

### SQL Injection

- Do not allow frontend to access the database directly
- Keep database operations in the backend
- Use parameter binding
- Avoid SQL string concatenation

### Storage Path

- Do not use free text as a path
- Generate paths from `sentence_template_id + voice_name`
- Generate safe paths in the backend

### XSS

- Do not render user input as HTML
- Do not use `dangerouslySetInnerHTML`
- Add character limits for future user-defined sentences

### Secret Management

- Do not expose Supabase service role key to the frontend
- Manage ElevenLabs API key in backend environment variables
- Manage Azure Speech key in backend environment variables

---

## 15. Acceptance Criteria

Phase 1 MVP is complete when:

- Fixed phrase categories can be displayed
- Fixed phrases can be displayed by category
- A fixed phrase can be selected
- Roger sample audio can be played
- Missing sample audio can be generated on first playback
- Generated MP3 files can be stored in Supabase Storage
- Stored MP3 files can be reused
- User speech can be sent to Azure AI Speech for assessment
- Assessment results can be displayed
- Only valid recognition/scoring results are saved to the database
- Latest score by sentence can be displayed
- Overall Pron history chart can be displayed
- Sentence-level score breakdown history chart can be displayed
- Users can navigate between Practice and History
- README and docs explain the design decisions

---

## 16. Deferred to Phase 2 or Later

- Full authentication
- Cross-device synchronization
- User-defined practice phrases
- Audio management for user-defined phrases
- `audio_assets` table
- Sarah support
- Voice selection UI
- Regeneration UI
- Speed control
- Audio deletion
- Backend proxy / signed URL
- Date range filters
- Sentence/category filters
- Weakness analysis
- Advice based on assessment results
- Advanced audio management
- User-recorded audio persistence

---

## 17. Interview Explanation Points

### Phase 1 Scope

> Phase 1 focuses on the core pronunciation training loop: choosing a fixed sentence, listening to sample audio, recording speech, receiving assessment results, and reviewing progress.  
> I intentionally deferred authentication, user-defined phrases, and full audio management to keep the MVP focused.

### TTS Cache

> I scoped audio persistence to reference audio only in Phase 1, treating it as a TTS cache rather than a full audio management feature.  
> This avoids unnecessary ElevenLabs API calls and improves playback speed, while keeping the scope focused.

### Fixed Roger Voice

> In Phase 1, I use one fixed sample voice to keep the user flow simple and reduce implementation complexity.  
> Multiple voices and voice selection can be added later, but they are not required to validate the core pronunciation training flow.

### History Charts

> The history screen aggregates pronunciation scores by practice day.  
> For each day, it uses the last five attempts to calculate the daily average.  
> The overall chart shows daily average, 5-practice-day moving average, and 20-practice-day moving average.  
> The score breakdown chart shows trends for overall, accuracy, fluency, completeness, and prosody.

### Public URL

> In an enterprise context, I would proxy audio through the backend or use signed URLs.  
> For Phase 1, since all reference audio is fixed and shared across users, I used public URLs to keep the scope focused.  
> I plan to reconsider protected audio delivery when authentication and user-defined phrases are introduced.

### Browser-local Identifier

> Phase 1 does not include full authentication.  
> Instead, I use a browser-local client ID to keep user history with minimal complexity.  
> Authentication is deferred to a later phase.
