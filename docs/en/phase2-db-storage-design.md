# Phase 2 DB / Storage Design

## 1. Purpose

This document defines the Phase 2 DB / Storage design for supporting multiple sample voice options and multiple sample audio playback buttons.

Phase 1 uses one default reference voice option. Phase 2 extends that design so a user can play more than one sample audio for the same sentence template.

## 2. Scope

### In Scope

- Support multiple sample voice options per sentence template.
- Support two sample audio playback buttons.
- Allow users to play either sample audio whenever they like.
- Request sample audio by voice option.
- Cache generated audio per voice option.
- Keep sentence template data, voice option data, and generated audio cache separate.

### Out of Scope

- User-uploaded audio.
- Advanced audio asset management.
- Speed control.
- Manual regeneration UI, unless needed later.
- Full voice option management UI for end users.
- User-specific custom voices.

## 3. Data Model Overview

Phase 2 uses `sentence_template_voice_options` to manage sample voice options separately from sentence templates and generated audio cache.

```text
sentence_categories
  |
  v
sentence_templates
  |
  v
sentence_template_voice_options
  |
  v
sentence_template_audios

sentence_templates
  |
  v
training_attempts
```

## 4. Table Responsibilities

### 4.1 `sentence_templates`

`sentence_templates` stores the main sentence template data.

It should not store fixed voice columns such as `voice_id_1` or `voice_id_2`.

Voice options are managed by `sentence_template_voice_options`.

Generated audio cache is managed by `sentence_template_audios`.

### 4.2 `sentence_template_voice_options`

`sentence_template_voice_options` stores sample voice options for each sentence template.

A sentence template can have multiple sample voice options, such as `voice_a` and `voice_b`.

This table is logically deleted.

Suggested columns:

```sql
create table public.sentence_template_voice_options (
  id uuid not null default gen_random_uuid(),

  sentence_template_id uuid not null,

  slot_key text not null,

  voice_id text not null,

  voice_name text not null,

  voice_provider text not null default 'elevenlabs',

  model_id text null,

  sort_order integer not null default 0,

  is_default boolean not null default false,

  is_active boolean not null default true,

  created_at timestamp with time zone not null default now(),

  updated_at timestamp with time zone not null default now(),

  deleted_at timestamp with time zone null,

  constraint sentence_template_voice_options_pkey primary key (id),

  constraint sentence_template_voice_options_template_fkey
    foreign key (sentence_template_id)
    references public.sentence_templates(id)
    on delete restrict
);
```

Recommended indexes:

```sql
create index idx_sentence_template_voice_options_template_id
on public.sentence_template_voice_options(sentence_template_id);

create unique index sentence_template_voice_options_active_slot_unique
on public.sentence_template_voice_options(sentence_template_id, slot_key)
where deleted_at is null;
```

Column notes:

| Column | Description |
| --- | --- |
| `id` | Primary key |
| `sentence_template_id` | Foreign key to `sentence_templates.id` |
| `slot_key` | Stable slot key, such as `voice_a` or `voice_b` |
| `voice_id` | External TTS voice ID |
| `voice_name` | Human-readable voice name |
| `voice_provider` | TTS provider, such as ElevenLabs |
| `model_id` | TTS model ID |
| `sort_order` | Display order |
| `is_default` | Default voice option |
| `is_active` | Active flag |
| `deleted_at` | Logical deletion timestamp |

#### Current state: the table exists but is empty

The table is groundwork. Nothing in the application reads it, writes it, or keeps it in step with
the sentences: sample audio is served from `sentence_template_audios`, which carries its own
`voice_id` and `model_id`, and the multiple-voice feature this table exists for is deferred to
Phase 3.

It is therefore deliberately left empty. It was populated once, by copying
`sentence_template_audios` row by row, and the copy immediately went stale: sentences created
afterwards got no row, and rows created through the app carried a null `model_id`. Data that no
code maintains does not stay true, and a half-correct table is worse than an empty one, because it
invites the reader to trust it.

Phase 3 populates it as part of building the feature, alongside the code that will maintain it:
a row must be created when a sentence is created, and logically deleted when a sentence is deleted.
Until then, an empty table is the honest state, and `sentence_template_audios.voice_option_id`
stays null for the same reason.

### 4.3 `sentence_template_audios`

`sentence_template_audios` stores generated sample audio cache for each sentence template and voice option.

This table is generated-audio cache and may be physically deleted when the related sentence or category is deleted.

Suggested change:

```sql
alter table public.sentence_template_audios
add column voice_option_id uuid null;
```

Suggested foreign key:

```sql
alter table public.sentence_template_audios
add constraint sentence_template_audios_voice_option_fkey
foreign key (voice_option_id)
references public.sentence_template_voice_options(id)
on delete restrict;
```

Recommended index:

```sql
create index idx_sentence_template_audios_voice_option_id
on public.sentence_template_audios(voice_option_id);
```

Notes:

- `voice_option_id` links generated audio cache to the voice option used to generate it.
- `voice_id` and `model_id` may remain in `sentence_template_audios` as generation-time snapshots.
- `audio_path` stores the Supabase Storage path for the generated MP3.
- Generated audio cache can be deleted and regenerated.

## 5. Storage Path

Reference audio files should use a stable slot-based path.

```text
preset/{sentence_template_id}/{slot_key}.mp3
```

Examples:

```text
preset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/voice_a.mp3
preset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/voice_b.mp3
```

This path should be stored in `sentence_template_audios.audio_path`.

Using `slot_key` is more stable than using `voice_name`, because the voice assigned to a slot can change while the UI slot remains the same.

## 6. UI Behavior

The UI should show two sample audio play buttons for a sentence template.

Example:

```text
[ Play Sample 1 ]
[ Play Sample 2 ]
```

Each button is linked to a different voice option.

For example:

| Button | Slot key | Meaning |
| --- | --- | --- |
| Play Sample 1 | `voice_a` | First sample voice |
| Play Sample 2 | `voice_b` | Second sample voice |

The labels should avoid hard-coding gender where possible. The app may use neutral labels such as `Sample 1` and `Sample 2`.

## 7. Playback Flow

When a user clicks a sample audio button:

1. Frontend sends `sentenceTemplateId` and a voice option identifier.
2. Backend loads the selected active voice option from `sentence_template_voice_options`.
3. Backend checks `sentence_template_audios.audio_path` for the selected voice option.
4. If cached audio exists, backend returns the public URL.
5. If cached audio does not exist, backend generates audio using the selected voice option.
6. Backend uploads the generated MP3 to Supabase Storage.
7. Backend updates `sentence_template_audios.audio_path`.
8. Backend returns the public URL.
9. Frontend plays the returned audio.

## 8. Generation Flow

When audio generation is required:

1. Backend loads the sentence text from `sentence_templates`.
2. Backend loads the selected voice option from `sentence_template_voice_options`.
3. Backend reads `voice_id` and `model_id` from the selected voice option.
4. Backend calls the TTS provider.
5. Backend uploads the generated MP3 to Supabase Storage using the deterministic path.
6. Backend creates or updates `sentence_template_audios`.
7. Backend stores `voice_option_id`, `voice_id`, `model_id`, and `audio_path`.
8. Backend returns the public URL.

## 9. Deletion Behavior

### 9.1 Sentence deletion

When a sentence template is deleted:

- `sentence_templates` is logically deleted.
- Related `sentence_template_voice_options` records are logically deleted.
- Related `sentence_template_audios` records are physically deleted.
- Related storage audio files are physically deleted.
- Related favorites may be physically deleted.
- `training_attempts.sentence_id` remains unchanged.

### 9.2 Category deletion

When a category is deleted:

- `sentence_categories` is logically deleted.
- Sentence templates under the category are logically deleted.
- Voice options under deleted sentence templates are logically deleted.
- Related `sentence_template_audios` records are physically deleted.
- Related storage audio files are physically deleted.
- Related favorites may be physically deleted.
- `training_attempts.sentence_id` remains unchanged.

### 9.3 Voice option deletion or replacement

When a voice option is deleted or replaced:

- `sentence_template_voice_options` is logically deleted.
- Related generated audio cache may be physically deleted.
- Related storage audio files may be physically deleted.
- The sentence template itself remains unchanged.
- New audio can be generated later for the new voice option.

## 10. Security Considerations

- The frontend must not send arbitrary external `voice_id` values.
- The frontend should request only existing active voice options.
- The backend should load `voice_id` and `model_id` from `sentence_template_voice_options`.
- Deleted voice options must not be used for new audio generation.
- Generated public audio URLs should point only to expected storage paths.

## 11. Design Decisions

### Why use `sentence_template_voice_options`?

A sentence template may need multiple sample voice options.

Using a child table avoids adding fixed columns such as `voice_id_1` and `voice_id_2` to `sentence_templates`.

This keeps the schema flexible and allows more voice options in the future.

### Why keep generated audio separate?

Generated audio is cache.

The sentence template is the source phrase.  
The voice option is the generation setting.  
The audio record is the generated result.

Separating these responsibilities makes deletion and regeneration easier to manage.

### Why use `slot_key`?

`slot_key` provides a stable UI slot, such as `voice_a` or `voice_b`.

The actual voice assigned to the slot can change later without changing the UI structure.

## 12. Acceptance Criteria

Phase 2 is considered complete when:

- A sentence template can have at least two active sample voice options.
- The UI can show two sample audio play buttons.
- Users can play either sample audio whenever they like.
- The frontend can request sample audio by voice option.
- Generated audio is cached per voice option.
- Deleting a sentence or category removes generated audio cache and storage files.
- Deleting a sentence or category does not break training history.
- The frontend does not display deleted sentence, category, voice option, or audio data.

## 13. Notes for Future Phases

Possible future improvements:

- Full voice option management UI.
- More than two sample voice options.
- User-specific voice preferences.
- Regeneration UI.
- Audio speed control.
- Better audio asset management.
