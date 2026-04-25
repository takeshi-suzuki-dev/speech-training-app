# Phase 1 DB / Storage Design

## 1. Purpose

This document defines the Phase 1 database and storage design for the pronunciation training app.

Phase 1 focuses on building a minimal but usable MVP with:

- persistent pronunciation assessment results
- multiple fixed practice phrases
- browser-local user identification
- minimal reference audio persistence
- TTS caching for fixed practice phrases

The goal is to keep the architecture lightweight while making the app usable for demos, self-training, and job interview discussions.

---

## 2. Scope

### In Scope

- Use Supabase PostgreSQL as the Phase 1 database
- Use Supabase Storage for generated reference audio files
- Store pronunciation assessment results
- Store fixed practice phrases
- Use a browser-local identifier as `user_id`
- Provide two fixed reference voices: Roger and Sarah
- Store ElevenLabs-generated MP3 files for fixed practice phrases
- Reuse stored MP3 files instead of calling ElevenLabs on every playback
- Pre-generate representative demo phrases
- Generate non-preloaded reference audio on first playback
- Use deterministic storage paths for reference audio files
- Play fixed reference audio directly from Supabase Storage public URLs

### Out of Scope

- Full authentication
- Cross-device user synchronization
- User-defined practice phrases
- User-recorded audio persistence
- Full audio management UI
- Voice selection UI
- Regeneration UI
- Speed control
- Audio deletion UI
- Complex access control
- Backend audio proxying
- Audio metadata table such as `audio_assets`

These items are deferred to Phase 2 or later.

---

## 3. Architecture Overview

Phase 1 uses Supabase for DB and object storage.

```text
Local Frontend / Local Backend
        |
        v
Supabase PostgreSQL
Supabase Storage

Production Frontend / Backend on AWS
        |
        v
Supabase PostgreSQL
Supabase Storage
```

This allows the app to be tested locally even after deployment, while keeping AWS running costs minimal.

---

## 4. Database Design

### 4.1 `practice_phrases`

Stores fixed practice phrases used in Phase 1.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / bigint | Primary key |
| `text` | text | Practice sentence |
| `display_order` | integer | Display order |
| `is_active` | boolean | Whether the phrase is available |
| `created_at` | timestamp | Created timestamp |
| `updated_at` | timestamp | Updated timestamp |

#### Notes

- Phase 1 only supports fixed practice phrases.
- User-defined phrases are deferred to Phase 2.

---

### 4.2 `training_attempts`

Stores pronunciation assessment results.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / bigint | Primary key |
| `user_id` | text | Browser-local identifier |
| `phrase_id` | uuid / bigint | Reference to `practice_phrases` |
| `reference_text` | text | Text used for pronunciation assessment |
| `transcript` | text | Recognized text |
| `recognition_status` | text | Azure recognition status |
| `overall_score` | numeric | Overall pronunciation score |
| `accuracy_score` | numeric | Accuracy score |
| `fluency_score` | numeric | Fluency score |
| `completeness_score` | numeric | Completeness score |
| `words_json` | jsonb | Word-level and phoneme-level details |
| `raw_json` | jsonb | Raw Azure response for debugging |
| `created_at` | timestamp | Created timestamp |

#### Notes

- `user_id` is not an authenticated user ID in Phase 1.
- It is a browser-local identifier generated on first access.
- `words_json` may include word-level, syllable-level, phoneme-level, and NBest phoneme details returned by Azure Speech.
- Full authentication is deferred to Phase 2.

---

### 4.3 No `audio_assets` Table in Phase 1

Phase 1 does not use an `audio_assets` table.

Reference audio files are managed by deterministic storage paths:

```text
preset/{phrase_id}/{voice_name}.mp3
```

For fixed practice phrases and two fixed voices, `phrase_id + voice_name` is enough to locate the reference audio file.

The frontend attempts to play the public URL directly. If the file is missing, the frontend calls the backend generation API. The backend generates the MP3 and uploads it to the deterministic path.

#### Why no audio metadata table in Phase 1?

An `audio_assets` table would be useful for full audio management, but it is not necessary for Phase 1 because:

- the app only supports fixed practice phrases
- the app only supports two fixed voices: Roger and Sarah
- the storage path can be derived from `phrase_id` and `voice_name`
- there is no user-defined phrase audio
- there is no voice selection UI
- there is no regeneration UI
- there is no audio deletion or replacement workflow

Avoiding an audio metadata table keeps the Phase 1 DB design simpler and reduces the risk of metadata/storage inconsistency.

---

## 5. Storage Design

### 5.1 Bucket

Supabase Storage bucket:

```text
reference-audio
```

Bucket access:

```text
Public
```

This bucket stores generated MP3 files for fixed practice phrases.

Phase 1 uses a public bucket because the stored audio files are fixed reference audio shared across users. They do not contain user-recorded audio, personal data, or paid user-specific content.

Backend proxying is deferred to Phase 2, when authentication and user-specific audio management may be introduced.

---

### 5.2 Storage Path

Reference audio files are stored using the following path format:

```text
preset/{phrase_id}/{voice_name}.mp3
```

Examples:

```text
preset/001/roger.mp3
preset/001/sarah.mp3
```

#### Notes

- The path is intentionally human-readable for easier debugging in Supabase Storage.
- Phase 1 does not use hash-based cache keys.
- Phase 1 does not store audio metadata in a separate `audio_assets` table.
- If user-defined phrases are added in Phase 2, the storage path design can be extended.

---

## 6. Reference Voices

Phase 1 uses two fixed reference voices:

| `voice_name` | Description |
|---|---|
| `roger` | Male reference voice |
| `sarah` | Female reference voice |

The actual ElevenLabs voice IDs are managed in backend configuration.

Example:

```text
roger -> ELEVENLABS_VOICE_ID_ROGER
sarah -> ELEVENLABS_VOICE_ID_SARAH
```

The UI may display the buttons as:

```text
[ Roger ] [ Sarah ]
```

---

## 7. TTS Cache Flow

### 7.1 Playback Flow

When a user clicks Roger or Sarah:

1. Frontend builds the Supabase Storage public URL using `phrase_id` and `voice_name`.
2. Frontend tries to play the MP3 directly from the public URL.
3. If playback succeeds, no backend call is needed.
4. If playback fails because the file does not exist, frontend calls the backend generation API.

Backend proxying is not used in Phase 1.

---

### 7.2 Generation Flow

If playback fails because the MP3 file does not exist:

1. Frontend calls the backend generation API with `phrase_id` and `voice_name`.
2. Backend validates `voice_name` as either `roger` or `sarah`.
3. Backend loads the phrase text from `practice_phrases`.
4. Backend resolves `voice_name` to the ElevenLabs voice ID.
5. Backend calls ElevenLabs TTS API.
6. Backend uploads the generated MP3 to Supabase Storage using the deterministic path.
7. Backend returns the Supabase Storage public URL.
8. Frontend plays the generated MP3 directly from the public URL.

Backend proxying is deferred to Phase 2, when authentication is introduced.

---

## 8. Pre-generation Strategy

Phase 1 uses a hybrid generation strategy.

### Pre-generated

Representative demo phrases are pre-generated for both Roger and Sarah.

Purpose:

- stable demo experience
- no initial TTS latency during demo
- lower risk during interview or presentation

### Generated on First Playback

Non-preloaded fixed phrases are generated on first playback.

Purpose:

- avoid generating unused audio
- reduce ElevenLabs API cost
- keep Phase 1 implementation lightweight

---

## 9. Error Handling

### Frontend Playback Failure

If the frontend cannot play the public MP3 URL:

- call the backend generation API
- retry playback using the URL returned by the backend

### ElevenLabs Generation Failure

If ElevenLabs generation fails:

- return an error response to the frontend
- show a user-friendly message
- do not create a broken audio file

### Supabase Storage Upload Failure

If upload fails:

- return a storage error response
- allow retry on next playback

### Missing Storage File

If the expected MP3 file is missing from storage:

- frontend playback fails
- frontend calls the backend generation API
- backend regenerates the audio
- backend uploads the MP3 again to the deterministic path
- backend returns the public playback URL

---

## 10. Environment Variables

Expected backend configuration:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET_REFERENCE_AUDIO

ELEVENLABS_API_KEY
ELEVENLABS_MODEL_ID
ELEVENLABS_VOICE_ID_ROGER
ELEVENLABS_VOICE_ID_SARAH
```

### Security Note

The Supabase service role key must never be exposed to the frontend.

All upload operations should be handled by the backend.

The frontend should not send `reference_text`, `voice_id`, `model_id`, or `storage_path` directly to the backend generation API.

The frontend should send only:

```json
{
  "phraseId": "001",
  "voiceName": "roger"
}
```

The backend derives the phrase text, ElevenLabs voice ID, model ID, and storage path.

---

## 11. Security Considerations

### SQL Injection

- The frontend does not access Supabase PostgreSQL directly.
- All database operations are handled by the Spring Boot backend.
- SQL statements must use parameter binding through JPA, Spring Data, `PreparedStatement`, or `NamedParameterJdbcTemplate`.
- String concatenation must not be used to build SQL queries.
- `voice_name` is restricted to fixed values: `roger` and `sarah`.

### Storage Path Safety

- Storage paths are generated by the backend or deterministically derived from trusted IDs.
- Free text must not be used directly in storage paths.
- In Phase 1, storage paths are based on `phrase_id` and `voice_name`.

### Frontend Display Safety

- User-provided text should be rendered as plain text.
- `dangerouslySetInnerHTML` should not be used for user-defined phrase text in later phases.

---

## 12. Phase 1 Design Decisions

### Why Supabase?

Supabase PostgreSQL and Supabase Storage are used to keep the infrastructure lightweight and easy to test locally.

This allows local frontend/backend development while using the same DB and storage as the deployed app.

### Why minimal TTS cache?

The app should not call ElevenLabs every time a user clicks the playback button.

Storing generated reference audio reduces unnecessary API calls and improves playback speed.

### Why only fixed practice phrases?

Phase 1 focuses on the core scoring feedback loop and fixed practice flow.

User-defined phrases require additional CRUD, validation, ownership, and audio management, so they are deferred to Phase 2.

### Why no `audio_assets` table in Phase 1?

In Phase 1, reference audio paths are deterministic.

For fixed practice phrases and two fixed voices, `phrase_id + voice_name` is enough to locate the file.

An `audio_assets` table will be introduced later when user-defined phrases and full audio management are added.

### Why public audio URLs in Phase 1?

In an enterprise context, audio files would usually be served through a backend proxy or controlled access layer to avoid exposing storage URLs directly.

In Phase 1, the stored files are fixed reference audio shared across users. They are not user-recorded audio, personal data, or paid user-specific content.

For this reason, Phase 1 uses Supabase Storage public URLs to keep the implementation simple and focused. Backend proxying is deferred to Phase 2, when authentication and user-specific audio management are introduced.

### Why no full voice management?

Phase 1 provides only two fixed voices, Roger and Sarah.

Voice selection, regeneration UI, speed control, and full audio management are deferred to Phase 2.

---

## 13. Acceptance Criteria

Phase 1 DB / Storage design is complete when:

- fixed practice phrases can be stored in Supabase PostgreSQL
- pronunciation assessment results can be stored
- Roger and Sarah buttons can be displayed for fixed phrases
- pre-generated demo phrase audio can be played
- frontend can build and play Supabase Storage public URLs
- non-preloaded phrase audio can be generated on first playback failure
- generated MP3 files are saved in Supabase Storage
- stored MP3 files are reused on later playback
- missing storage files can trigger regeneration through the backend generation API
- user-recorded audio is not stored
- no `audio_assets` table is required in Phase 1

---

## 14. Deferred to Phase 2

The following items are deferred:

- full authentication
- user-defined practice phrases
- user-specific audio management
- `audio_assets` table
- voice selection UI
- regeneration UI
- speed control
- audio deletion
- backend proxying for protected audio playback
- private bucket / signed URL strategy if needed
- cross-device user history

---

## 15. Phase 2 Notes

Phase 1 intentionally avoids an `audio_assets` table because fixed reference audio can be located by deterministic paths.

In Phase 2, an `audio_assets` table should be introduced when the app supports user-defined practice phrases and more advanced audio management.

Possible Phase 2 use cases include:

- user-defined practice phrase audio
- user-specific audio ownership
- voice selection
- regeneration UI
- audio status management
- deletion or replacement handling
- private bucket / signed URL strategy
- backend proxying for protected audio playback

Phase 1 also intentionally uses public URLs for fixed reference audio.

In Phase 2, when authentication and user-defined practice phrases are introduced, the audio access model should be reconsidered.

The planned Phase 2 direction is:

- introduce an `audio_assets` table
- associate audio files with user-defined phrases and users
- move from public URL playback to backend proxying or signed URLs if user-specific audio needs protection
- keep user-recorded audio out of scope unless explicitly added later
