insert into public.sentence_templates (
  category_id,
  template_key,
  title,
  display_text,
  scoring_text,
  sample_audio_text,
  difficulty,
  sort_order,
  is_active
)
values
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_want_to_improve_english',
    'I want to improve my English',
    'I want to improve my English.',
    'I wanna improve my English.',
    'I wanna improve my English.',
    'easy',
    10,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_want_to_play_tennis',
    'I want to play tennis',
    'I want to play tennis.',
    'I wanna play tennis.',
    'I wanna play tennis.',
    'easy',
    20,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'interview_want_to_work_in_australia',
    'I want to work in Australia',
    'I want to work in Australia.',
    'I wanna work in Australia.',
    'I wanna work in Australia.',
    'easy',
    10,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'interview_explain_my_experience',
    'I want to explain my experience clearly',
    'I want to explain my experience clearly.',
    'I wanna explain my experience clearly.',
    'I wanna explain my experience clearly.',
    'medium',
    20,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_implemented_backend_api',
    'I implemented the backend API',
    'I implemented the backend API.',
    'I implemented the backend API.',
    'I implemented the backend API.',
    'medium',
    10,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_saved_results_to_database',
    'I saved the assessment results to the database',
    'I saved the assessment results to the database.',
    'I saved the assessment results to the database.',
    'I saved the assessment results to the database.',
    'medium',
    20,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'portfolio'),
    'portfolio_building_pronunciation_app',
    'I am building a pronunciation training app',
    'I am building a pronunciation training app.',
    'I''m building a pronunciation training app.',
    'I''m building a pronunciation training app.',
    'medium',
    10,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'portfolio'),
    'portfolio_assess_pronunciation',
    'This app helps users assess their pronunciation',
    'This app helps users assess their pronunciation.',
    'This app helps users assess their pronunciation.',
    'This app helps users assess their pronunciation.',
    'medium',
    20,
    true
  )
on conflict (template_key)
do update set
  category_id = excluded.category_id,
  title = excluded.title,
  display_text = excluded.display_text,
  scoring_text = excluded.scoring_text,
  sample_audio_text = excluded.sample_audio_text,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
  