create table if not exists public.template_favorites (
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

create index if not exists idx_template_favorites_user_id
on public.template_favorites(user_id);

create index if not exists idx_template_favorites_sentence_template_id
on public.template_favorites(sentence_template_id);