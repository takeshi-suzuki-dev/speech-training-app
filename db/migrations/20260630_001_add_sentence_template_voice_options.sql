create table if not exists public.sentence_template_voice_options (
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

create index if not exists idx_sentence_template_voice_options_template_id
on public.sentence_template_voice_options(sentence_template_id);

create unique index if not exists sentence_template_voice_options_active_slot_unique
on public.sentence_template_voice_options(sentence_template_id, slot_key)
where deleted_at is null;

alter table public.sentence_template_audios
add column if not exists voice_option_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sentence_template_audios_voice_option_fkey'
  ) then
    alter table public.sentence_template_audios
    add constraint sentence_template_audios_voice_option_fkey
    foreign key (voice_option_id)
    references public.sentence_template_voice_options(id)
    on delete set null;
  end if;
end $$;

create index if not exists idx_sentence_template_audios_voice_option_id
on public.sentence_template_audios(voice_option_id);

create unique index if not exists sentence_template_audios_template_voice_option_unique
on public.sentence_template_audios(sentence_template_id, voice_option_id)
where voice_option_id is not null;
