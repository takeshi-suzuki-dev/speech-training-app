-- One audio row per seed sentence, with audio_path left null: the file is generated on first
-- playback and the path filled in then.
insert into public.sentence_template_audios
  (sentence_template_id, voice_role, voice_id, model_id, audio_path)
select
  st.id,
  'male',
  'CwhRBWXzGAHq8TQ4Fs17',
  'eleven_multilingual_v2',
  null
from public.sentence_templates st
join public.sentence_categories sc on sc.id = st.category_id
where sc.category_key in ('daily', 'interview', 'tech', 'portfolio')
on conflict (sentence_template_id, voice_role) do nothing;
