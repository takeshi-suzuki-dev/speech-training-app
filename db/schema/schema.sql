create table public.sentence_categories (
  id uuid not null default gen_random_uuid(),
  category_key text null,
  display_name text not null,
  description text null,
  owner_firebase_uid text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),

  constraint sentence_categories_pkey primary key (id),
  constraint sentence_categories_category_key_key unique (category_key)
);

create table public.sentence_templates (
  id uuid not null default gen_random_uuid(),
  category_id uuid not null,
  owner_firebase_uid text,
  template_key text null,
  title text not null,
  display_text text not null,
  scoring_text text not null,
  sample_audio_text text not null,
  difficulty text not null default 'easy',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),

  constraint sentence_templates_pkey primary key (id),
  constraint sentence_templates_template_key_key unique (template_key),

  constraint sentence_templates_category_id_fkey
    foreign key (category_id)
    references public.sentence_categories(id)
    on delete restrict
);

create table public.sentence_template_audios (
  id uuid not null default gen_random_uuid(),
  sentence_template_id uuid not null,
  voice_role text not null,
  voice_id text not null,
  model_id text null,
  audio_path text null,
  created_at timestamp with time zone not null default now(),

  constraint sentence_template_audios_pkey primary key (id),

  constraint sentence_template_audios_template_fkey
    foreign key (sentence_template_id)
    references public.sentence_templates(id)
    on delete cascade,

  constraint sentence_template_audios_unique
    unique (sentence_template_id, voice_role)
);

create table public.template_favorites (
  user_id text not null,
  sentence_template_id uuid not null,
  created_at timestamp with time zone not null default now(),

  constraint template_favorites_pkey
    primary key (user_id, sentence_template_id),

  constraint template_favorites_sentence_template_id_fkey
    foreign key (sentence_template_id)
    references public.sentence_templates(id)
    on delete cascade
);

create index idx_template_favorites_user_id
on public.template_favorites(user_id);

create index idx_template_favorites_sentence_template_id
on public.template_favorites(sentence_template_id);

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
