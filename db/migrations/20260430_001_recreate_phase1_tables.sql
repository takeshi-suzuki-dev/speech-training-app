begin;

drop table if exists public.training_attempts;
drop table if exists public.sentence_templates;
drop table if exists public.sentence_categories;

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

create table public.training_attempts (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null,
  user_id uuid null,
  mode text not null default 'sentence',
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
  created_at timestamp with time zone not null default now(),

  constraint training_attempts_pkey primary key (id),

  constraint training_attempts_sentence_id_fkey
    foreign key (sentence_id)
    references public.sentence_templates(id)
    on delete set null
);

commit;
