update public.sentence_template_audios sta
set voice_option_id = stvo.id
from public.sentence_template_voice_options stvo
where stvo.sentence_template_id = sta.sentence_template_id
  and stvo.slot_key = case
    when sta.voice_role = 'male' then 'voice_a'
    else sta.voice_role
  end
  and stvo.deleted_at is null
  and sta.voice_option_id is null;
