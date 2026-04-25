# Phase 1 MVP Spec

## 1. Purpose

This document defines the Phase 1 MVP specification for the pronunciation training app.

The purpose of Phase 1 is to turn the technical PoC into a minimally usable pronunciation training application.

The Phase 1 goal is to make the app usable for:

- self-training
- product demos
- portfolio presentation
- job interview discussions

Phase 1 is considered successful when the app can:

- provide fixed practice phrases
- play reference audio
- accept user speech input
- display pronunciation assessment results from Azure AI Speech
- store assessment results in the database
- show basic history
- be explained through a live URL, README, and documentation

---

## 2. Phase 1 Positioning

Phase 1 is the MVP, or Minimum Viable Product.

The PoC verifies that Azure AI Speech and ElevenLabs can be integrated technically.  
Phase 1 organizes those technical pieces into a minimal product that users can actually try.

Phase 1 is not the final product.

The following items are intentionally deferred to Phase 2 or later:

- full authentication
- user-defined practice phrases
- full audio management
- progress visualization
- advanced advice generation
- cross-device synchronization

---

## 3. Scope

### In Scope

- Manage multiple fixed practice phrases
- Let users select a fixed practice phrase
- Play Roger / Sarah reference audio
- Implement minimal TTS caching for ElevenLabs-generated audio
- Run pronunciation assessment using Azure AI Speech
- Display pronunciation assessment results
- Store assessment results in Supabase PostgreSQL
- Use a browser-local identifier for minimal user separation
- Show basic assessment history
- Deploy the application
- Prepare README and documentation
- Make the app explainable in English for interviews

### Out of Scope

- Full login / authentication
- Cross-device synchronization
- User-defined practice phrases
- User-recorded audio persistence
- Voice selection UI
- Regeneration UI
- Speed control
- Full audio management screen
- Advanced progress charts
- Advanced advice based on assessment results
- Protected delivery of user-specific audio
- Backend proxying for audio playback

---

## 4. User Identification

Phase 1 does not include full authentication.

Instead, the app uses a browser-local identifier to associate assessment history with the current browser.

Implementation detail:

- Generate a UUID on first access
- Store it in localStorage
- Use it as `user_id` in Phase 1

### Policy

- `user_id` is not an authenticated user ID
- History can be linked within the same browser
- Cross-device sync is not supported
- Authentication is deferred to Phase 2

### Interview Explanation

> Phase 1 does not include full authentication.  
> Instead, I use a browser-local identifier to keep user history with minimal complexity.  
> This allowed me to focus on the core scoring feedback loop first, while keeping the design flexible enough to add authentication in Phase 2.

---

## 5. Fixed Practice Phrases

Phase 1 does not allow users to add custom practice phrases.

Instead, the app provides multiple fixed practice phrases managed by the application.

### Requirements

- Store fixed practice phrases in the database
- Support display order
- Support active / inactive status
- Let users select a practice phrase
- Use the selected phrase as the reference text for pronunciation assessment

### Deferred to Phase 2

- User-defined practice phrase creation
- User-defined practice phrase editing
- User-defined practice phrase deletion
- Reference audio management for user-defined phrases

---

## 6. Reference Audio

Phase 1 provides two fixed reference voices for fixed practice phrases:

- Roger
- Sarah

### UI Concept

```text
Practice phrase

[ Roger ] [ Sarah ]
```

The user can play either reference voice.

### Policy

- Roger and Sarah are fixed voices
- No voice selection UI
- No speed control
- No regeneration button
- Reference audio files are stored in Supabase Storage
- The frontend plays public URLs directly
- Backend proxying is not used in Phase 1

### TTS Cache

- Representative demo phrases are pre-generated
- Other fixed phrase audio is generated on first playback
- Generated MP3 files are reused
- ElevenLabs is not called on every playback

### Deferred to Phase 2

- Voice selection
- Regeneration UI
- Full audio management
- Audio management for user-defined phrases
- Backend proxying / signed URLs

---

## 7. Pronunciation Assessment

Phase 1 uses Azure AI Speech for pronunciation assessment.

### Input

- Reference text
- User speech audio

### Output

- Recognized transcript
- Recognition status
- Overall pronunciation score
- Accuracy score
- Fluency score
- Completeness score
- Word-level details
- Phoneme-level details
- Raw JSON response

### Display Policy

Phase 1 displays the result in a clear single-screen layout.

At minimum, the UI should show:

- recognized transcript
- overall score
- accuracy / fluency / completeness scores
- word-level assessment
- error or no-match status when applicable

---

## 8. Assessment Result Persistence

Assessment results are stored in Supabase PostgreSQL.

Main fields:

- `user_id`
- `phrase_id`
- `reference_text`
- `transcript`
- `recognition_status`
- `overall_score`
- `accuracy_score`
- `fluency_score`
- `completeness_score`
- `words_json`
- `raw_json`
- `created_at`

`words_json` may include word-level and phoneme-level details returned by Azure Speech.

---

## 9. Basic History

Phase 1 provides basic assessment history.

### Requirements

- Fetch assessment history linked to the browser-local identifier
- Show date/time, phrase, and score
- Allow users to review previous attempts in a simple form

### Deferred to Phase 2

- Progress charts
- Trend visualization
- Weakness analysis
- Advice generation

---

## 10. API Requirements

Phase 1 assumes the following minimal APIs.

### Practice Phrases

```text
GET /api/practice-phrases
```

Fetch fixed practice phrases.

### Pronunciation Assessment

```text
POST /api/assessments
```

Submit user speech audio and run Azure AI Speech pronunciation assessment.

### Assessment History

```text
GET /api/assessments?userId={userId}
```

Fetch assessment history linked to the browser-local identifier.

### Reference Audio Generation

```text
POST /api/reference-audio/generate
```

Generate reference audio when the fixed phrase audio file does not exist.

Frontend sends only:

```json
{
  "phraseId": "001",
  "voiceName": "roger"
}
```

The backend derives:

- reference text
- ElevenLabs voice ID
- model ID
- storage path

---

## 11. DB / Storage

Detailed DB / Storage design is defined in:

```text
docs/en/phase1-db-storage-design.md
docs/jp/phase1-db-storage-design.md
```

Phase 1 policy:

- DB: Supabase PostgreSQL
- Storage: Supabase Storage
- Storage bucket: `reference-audio`
- Bucket access: Public
- Reference audio path: `preset/{phrase_id}/{voice_name}.mp3`
- No `audio_assets` table in Phase 1

---

## 12. Error Handling

### Azure AI Speech

- Switch result display based on `RecognitionStatus`
- Show user-friendly messages for NoMatch, timeout, and error cases
- Keep raw JSON for debugging

### ElevenLabs

- Show an error if generation fails
- Do not store broken audio files
- Allow retry on the next playback attempt

### Supabase Storage

- Return an error if upload fails
- If public URL playback fails, call the backend generation API

---

## 13. Security Policy

### SQL Injection

- The frontend does not access the database directly
- Database operations are handled by the backend
- SQL must use parameter binding
- SQL string concatenation must be avoided

### Storage Path Safety

- Free text must not be used directly in storage paths
- In Phase 1, storage paths are derived from `phrase_id` and `voice_name`
- The backend manages storage path generation for upload operations

### XSS

- User-provided text must be rendered as plain text
- `dangerouslySetInnerHTML` must not be used for user-defined phrase text in later phases

### Secret Management

- Supabase service role key must never be exposed to the frontend
- ElevenLabs API key must be managed as a backend environment variable

---

## 14. Acceptance Criteria

Phase 1 MVP is complete when:

- fixed practice phrases can be displayed
- users can select a fixed practice phrase
- Roger / Sarah reference audio buttons are displayed
- pre-generated demo phrase audio can be played
- non-preloaded reference audio can be generated on first playback failure
- generated MP3 files can be stored in Supabase Storage
- stored MP3 files can be reused
- user speech can be submitted for Azure AI Speech assessment
- assessment results can be displayed
- assessment results can be stored in the database
- basic history can be viewed
- the app can be deployed
- README and docs explain the design decisions

---

## 15. Deferred to Phase 2

The following items are deferred to Phase 2 or later:

- full authentication
- cross-device synchronization
- user-defined practice phrases
- audio management for user-defined phrases
- `audio_assets` table
- voice selection UI
- regeneration UI
- speed control
- audio deletion
- backend proxying / signed URLs
- progress charts
- advice based on assessment results
- advanced audio management
- user-recorded audio persistence

---

## 16. Interview Explanation Points

### Phase 1 Scope

> Phase 1 focuses on the core scoring feedback loop.  
> I intentionally deferred authentication, user-defined phrases, and full audio management to keep the MVP focused.

### TTS Cache

> I scoped audio persistence to reference audio only in Phase 1, treating it as a TTS cache rather than a full audio management feature.  
> This avoids unnecessary ElevenLabs API calls and improves playback speed, while keeping the scope focused.

### Public URL

> In an enterprise context, I would proxy audio through the backend or use signed URLs.  
> For Phase 1, since all reference audio is fixed and shared across users, I used public URLs to keep the scope focused.  
> I plan to reconsider protected audio delivery in Phase 2 when authentication and user-defined phrases are introduced.

### Browser-local Identifier

> Phase 1 does not include full authentication.  
> Instead, I use a browser-local identifier to keep user history with minimal complexity.  
> Authentication is deferred to Phase 2.
