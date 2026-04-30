# Phase 1 DB / Storage Design

## 1. Purpose

This document defines the Phase 1 database and storage design for the pronunciation training app.

Phase 1 focuses on building a minimal but usable MVP with:

- persistent pronunciation assessment results
- multiple fixed practice phrases organized by category
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
- Store categories and fixed practice phrases
- Use a browser-local identifier (UUID) as `client_id`
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
- Category ownership management via `owner_type` / `owner_user_id` (deferred to Phase 2)

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

Phase 1 uses three tables:

```text
sentence_categories
        |
        v
sentence_templates
        |
        v
training_attempts
```

Foreign keys are applied as follows:

- `sentence_templates.category_id` → `sentence_categories.id` (ON DELETE RESTRICT)
- `training_attempts.sentence_id` → `sentence_templates.id` (ON DELETE SET NULL)

Value constraints are managed by application-level enums, except for `mode` in `training_attempts`, which is enforced by a CHECK constraint at the database level.

---

### 4.1 `sentence_categories`

Stores practice phrase categories.

```sql
create table public.sentence_categories (
  id uuid not null default gen_random_uuid(),
  category_key text null,
  display_name text not null,
  description text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),

  constraint sentence_categories_pkey primary key (id),
  constraint sentence_categories_category_key_key unique (category_key)
);
```

| Column         | Description                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| `id`           | Primary key                                                                     |
| `category_key` | Stable key for system categories (e.g., daily, interview, tech). Unique or null |
| `display_name` | Display name shown in the UI                                                    |
| `description`  | Category description                                                            |
| `sort_order`   | Display order                                                                   |
| `is_active`    | Logical show/hide flag                                                          |
| `created_at`   | Created timestamp                                                               |

#### Notes

- Phase 1 supports system-provided categories only. `owner_type` and `owner_user_id` are deferred to Phase 2.
- `category_key` is used as a stable reference key for seeding and testing.

---

### 4.2 `sentence_templates`

Stores the master data for practice phrases, including reference audio metadata.

```sql
create table public.sentence_templates (
  id uuid not null default gen_random_uuid(),
  category_id uuid not null,
  title text not null,
  display_text text not null,
  scoring_text text not null,
  sample_audio_text text not null,
  sample_audio_path text null,
  voice_id text null,
  model_id text null,
  difficulty text not null default 'easy',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),

  constraint sentence_templates_pkey primary key (id),

  constraint sentence_templates_category_id_fkey
    foreign key (category_id)
    references public.sentence_categories(id)
    on delete restrict
);
```

| Column              | Description                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `id`                | Primary key                                                                                            |
| `category_id`       | Foreign key to `sentence_categories.id`                                                                |
| `title`             | Title shown in the phrase list                                                                         |
| `display_text`      | Text displayed on screen                                                                               |
| `scoring_text`      | Text submitted to Azure for pronunciation assessment (may differ from display text, e.g., wanna forms) |
| `sample_audio_text` | Text sent to ElevenLabs for TTS generation                                                             |
| `sample_audio_path` | Path of the generated MP3 in Supabase Storage                                                          |
| `voice_id`          | ElevenLabs voice ID (typically resolved by backend; stored for reference)                              |
| `model_id`          | ElevenLabs model ID                                                                                    |
| `difficulty`        | easy / medium / hard. Not enforced by DB CHECK; managed by application enum                            |
| `sort_order`        | Display order                                                                                          |
| `is_active`         | Logical show/hide flag                                                                                 |
| `created_at`        | Created timestamp                                                                                      |

#### Notes

- `difficulty` value constraints are managed by application-level enum. No DB CHECK constraint is used.
- `sample_audio_path` stores the deterministic Supabase Storage path for the generated MP3.

---

### 4.3 `training_attempts`

Stores pronunciation assessment results.

```sql
create table public.training_attempts (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null,
  user_id uuid null,
  mode text not null,
  sentence_id uuid null,
  reference_text text not null,
  recognized_text text null,
  overall_score numeric null,
  accuracy_score numeric null,
  fluency_score numeric null,
  completeness_score numeric null,
  prosody_score numeric null,
  words_json jsonb null,
  audio_duration_ms integer null,
  scored_at timestamp with time zone not null default now(),
  created_at timestamp with time zone null default now(),

  constraint training_attempts_pkey primary key (id),

  constraint training_attempts_sentence_id_fkey
    foreign key (sentence_id)
    references public.sentence_templates(id)
    on delete set null,

  constraint training_attempts_mode_check check (
    mode = any (array['sentence'::text, 'free'::text])
  )
);
```

| Column               | Description                                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| `id`                 | Primary key                                                                        |
| `client_id`          | Browser-local UUID generated on first access. Used to associate history in Phase 1 |
| `user_id`            | Reserved for authenticated user ID in Phase 2. Null in Phase 1                     |
| `mode`               | sentence or free. Enforced by DB CHECK constraint                                  |
| `sentence_id`        | Foreign key to `sentence_templates.id`. Null when `mode = 'free'`                  |
| `reference_text`     | Snapshot of the text used for scoring                                              |
| `recognized_text`    | Azure speech recognition result                                                    |
| `overall_score`      | Overall pronunciation score                                                        |
| `accuracy_score`     | Accuracy score                                                                     |
| `fluency_score`      | Fluency score                                                                      |
| `completeness_score` | Completeness score                                                                 |
| `prosody_score`      | Prosody score                                                                      |
| `words_json`         | Word-level assessment details                                                      |
| `audio_duration_ms`  | Audio duration in milliseconds                                                     |
| `scored_at`          | Scoring timestamp. Used as the basis for history graphs and daily aggregation      |
| `created_at`         | DB record creation timestamp                                                       |

#### Notes

- `client_id` is not an authenticated user ID. It is a UUID generated on first access and stored in browser localStorage.
- The `mode` CHECK constraint is retained because the values are well-defined and the column is intentionally forward-looking (free speech mode is planned for Phase 3).
- `sentence_id` uses ON DELETE SET NULL so that assessment history is preserved even if a template is deleted.
- `user_id` is a forward-looking column for Phase 2 authentication. It is null in Phase 1.

---

### 4.4 No `audio_assets` Table in Phase 1

Phase 1 does not use an `audio_assets` table.

Reference audio paths are managed via `sentence_templates.sample_audio_path`. For fixed practice phrases and two fixed voices, `sentence_template_id + voice_name` is enough to locate the reference audio file.

#### Why no audio metadata table in Phase 1?

- The app only supports fixed practice phrases
- The app only supports two fixed voices: Roger and Sarah
- The storage path can be derived deterministically from `sentence_template_id` and `voice_name`
- There is no user-defined phrase audio
- There is no voice selection UI
- There is no regeneration UI

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

Phase 1 uses a public bucket because the stored audio files are fixed reference audio shared across users. They do not contain user-recorded audio, personal data, or paid user-specific content.

Backend proxying is deferred to Phase 2, when authentication and user-specific audio management may be introduced.

---

### 5.2 Storage Path

Reference audio files are stored using the following path format:

```text
preset/{sentence_template_id}/{voice_name}.mp3
```

Examples:

```text
preset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/roger.mp3
preset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/sarah.mp3
```

This path is stored in `sentence_templates.sample_audio_path`.

---

## 6. Reference Voices

Phase 1 uses two fixed reference voices:

| `voice_name` | Description            |
| ------------ | ---------------------- |
| `roger`      | Male reference voice   |
| `sarah`      | Female reference voice |

The actual ElevenLabs voice IDs are managed in backend configuration:

```text
roger -> ELEVENLABS_VOICE_ID_ROGER
sarah -> ELEVENLABS_VOICE_ID_SARAH
```

---

## 7. TTS Cache Flow

### 7.1 Playback Flow

When a user clicks Roger or Sarah:

1. Frontend builds the Supabase Storage public URL using `sentence_template_id` and `voice_name`.
2. Frontend tries to play the MP3 directly from the public URL.
3. If playback succeeds, no backend call is needed.
4. If playback fails because the file does not exist, frontend calls the backend generation API.

Backend proxying is not used in Phase 1.

---

### 7.2 Generation Flow

If playback fails because the MP3 file does not exist:

1. Frontend calls the backend generation API with `sentenceTemplateId` and `voiceName`.
2. Backend validates `voice_name` as either `roger` or `sarah`.
3. Backend loads the phrase text from `sentence_templates`.
4. Backend resolves `voice_name` to the ElevenLabs voice ID.
5. Backend calls ElevenLabs TTS API.
6. Backend uploads the generated MP3 to Supabase Storage using the deterministic path.
7. Backend updates `sentence_templates.sample_audio_path`.
8. Backend returns the Supabase Storage public URL.
9. Frontend plays the generated MP3 directly from the public URL.

---

## 8. Pre-generation Strategy

Phase 1 uses a hybrid generation strategy.

### Pre-generated

Representative demo phrases are pre-generated for both Roger and Sarah to ensure stable demo experience and avoid TTS latency during interviews or presentations.

### Generated on First Playback

Non-preloaded fixed phrases are generated on first playback to reduce ElevenLabs API cost and keep Phase 1 implementation lightweight.

---

## 9. Error Handling

### Frontend Playback Failure

If the frontend cannot play the public MP3 URL:

- call the backend generation API
- retry playback using the URL returned by the backend

### ElevenLabs Generation Failure

- return an error response to the frontend
- show a user-friendly error message
- do not create a broken audio file

### Missing Storage File

If the expected MP3 file is missing from storage:

- frontend playback fails
- frontend calls the backend generation API
- backend regenerates the audio and uploads to the same deterministic path
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

The Supabase service role key must never be exposed to the frontend. All upload operations are handled by the backend.

The frontend sends only:

```json
{
  "sentenceTemplateId": "a1b2c3d4-...",
  "voiceName": "roger"
}
```

The backend derives phrase text, ElevenLabs voice ID, model ID, and storage path.

---

## 11. Security Considerations

### SQL Injection

- The frontend does not access Supabase PostgreSQL directly.
- All database operations are handled by the Spring Boot backend.
- SQL statements use parameter binding through JPA, Spring Data, `PreparedStatement`, or `NamedParameterJdbcTemplate`.
- `voice_name` is restricted to fixed values: `roger` and `sarah`.

### Storage Path Safety

- Storage paths are generated by the backend or deterministically derived from trusted IDs.
- Free text must not be used directly in storage paths.

---

## 12. Phase 1 Design Decisions

### Why three tables?

The `sentence_categories` → `sentence_templates` → `training_attempts` hierarchy makes it easy to manage practice phrases by category. Foreign keys make the relationships explicit in the schema and in the ER diagram.

### Why use foreign keys?

The parent-child relationships between the three tables are clear. For a portfolio project intended to demonstrate DB design, foreign keys are the right choice.

### Why no CHECK constraint on `difficulty`?

The allowed values for `difficulty` (easy, medium, hard) are enforced by an application-level enum. Adding a DB CHECK constraint would be redundant with the application layer, and the spec may still evolve across phases.

### Why keep the CHECK constraint on `mode`?

`mode` (sentence / free) is a well-defined two-value field. It is also a forward-looking column for Phase 3 free speech, which makes its definition stable enough to enforce at the DB level.

### Why no `owner_type` / `owner_user_id` in Phase 1?

Phase 1 only uses system-provided categories. Ownership is not a concern yet. Adding these columns in Phase 2, when user-defined categories are introduced, keeps the Phase 1 schema clean.

### Why Supabase?

Supabase PostgreSQL and Supabase Storage keep the infrastructure lightweight and allow local development to use the same DB and storage as the deployed app.

### Why minimal TTS cache?

Calling ElevenLabs on every playback is wasteful and slow. Storing generated audio reduces API costs and improves the user experience.

### Why no `audio_assets` table in Phase 1?

Phase 1 audio paths are deterministic. `sentence_template_id + voice_name` is enough to locate any reference audio file. An `audio_assets` table will be introduced in Phase 2 when user-defined phrases and full audio management are added.

### Why public audio URLs in Phase 1?

Phase 1 audio files are fixed reference audio shared across all users. They contain no personal data or user-specific content. Public URLs are sufficient. Backend proxying is deferred to Phase 2.

---

## 13. Acceptance Criteria

Phase 1 DB / Storage design is complete when:

- categories can be stored in `sentence_categories`
- practice phrases can be stored in `sentence_templates`
- pronunciation assessment results can be stored in `training_attempts`
- Roger and Sarah buttons can be displayed for each phrase
- pre-generated demo phrase audio can be played
- frontend can build and play Supabase Storage public URLs
- non-preloaded phrase audio can be generated on first playback failure
- generated MP3 files are saved in Supabase Storage with paths recorded in `sentence_templates.sample_audio_path`
- stored MP3 files are reused on later playback
- user-recorded audio is not stored

---

## 14. Deferred to Phase 2

The following items are deferred:

- full authentication (`user_id` column is kept as a forward-looking field in `training_attempts`)
- user-defined practice phrases
- category ownership management via `owner_type` / `owner_user_id`
- user-specific audio management
- `audio_assets` table
- voice selection UI
- regeneration UI
- speed control
- audio deletion
- backend proxying for protected audio playback
- private bucket / signed URL strategy
- cross-device user history

---

## 15. Phase 2 Notes

In Phase 2, the following changes to the DB design should be considered:

- Add `owner_type` and `owner_user_id` to `sentence_categories` to support user-defined categories
- Add ownership management to `sentence_templates` for user-defined phrases
- Introduce an `audio_assets` table for user-defined phrase audio and audio status management
- Migrate from public URLs to backend proxying or signed URLs if user-specific audio requires protection
- Reassess the need for additional CHECK constraints at the time of Phase 2 design
