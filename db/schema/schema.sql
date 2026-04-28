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
  constraint training_attempts_mode_check check (
    mode = any (array['sentence'::text, 'free'::text])
  )
);

