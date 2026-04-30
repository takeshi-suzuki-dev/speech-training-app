insert into public.sentence_templates (
  category_id,
  title,
  display_text,
  scoring_text,
  sample_audio_text,
  sample_audio_path,
  voice_id,
  model_id,
  difficulty,
  sort_order,
  is_active
)
values
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'I want to improve my English',
    'I want to improve my English.',
    'I wanna improve my English.',
    'I wanna improve my English.',
    null,
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    'easy',
    10,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'I want to play tennis',
    'I want to play tennis.',
    'I wanna play tennis.',
    'I wanna play tennis.',
    null,
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    'easy',
    20,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'I want to work in Australia',
    'I want to work in Australia.',
    'I wanna work in Australia.',
    'I wanna work in Australia.',
    null,
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    'easy',
    10,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'I implemented the backend API',
    'I implemented the backend API.',
    'I implemented the backend API.',
    'I implemented the backend API.',
    null,
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    'medium',
    10,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'portfolio'),
    'I am building a pronunciation training app',
    'I am building a pronunciation training app.',
    'I''m building a pronunciation training app.',
    'I''m building a pronunciation training app.',
    null,
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    'medium',
    10,
    true
  );
  