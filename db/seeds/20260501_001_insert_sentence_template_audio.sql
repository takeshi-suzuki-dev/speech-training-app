insert into public.sentence_template_audios (
  sentence_template_id,
  voice_role,
  voice_id,
  model_id,
  audio_path
)
values
  (
    (select id from public.sentence_templates where template_key = 'daily_want_to_improve_english'),
    'male',
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    null
  ),
  (
    (select id from public.sentence_templates where template_key = 'daily_want_to_play_tennis'),
    'male',
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    null
  ),
  (
    (select id from public.sentence_templates where template_key = 'interview_want_to_work_in_australia'),
    'male',
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    null
  ),
  (
    (select id from public.sentence_templates where template_key = 'interview_explain_my_experience'),
    'male',
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    null
  ),
  (
    (select id from public.sentence_templates where template_key = 'tech_implemented_backend_api'),
    'male',
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    null
  ),
  (
    (select id from public.sentence_templates where template_key = 'tech_saved_results_to_database'),
    'male',
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    null
  ),
  (
    (select id from public.sentence_templates where template_key = 'portfolio_building_pronunciation_app'),
    'male',
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    null
  ),
  (
    (select id from public.sentence_templates where template_key = 'portfolio_assess_pronunciation'),
    'male',
    'EXAVITQu4vr4xnSDxMaL',
    'eleven_multilingual_v2',
    null
  )
on conflict (sentence_template_id, voice_role)
do update set
  voice_id = excluded.voice_id,
  model_id = excluded.model_id,
  audio_path = excluded.audio_path;
  