insert into public.sentence_template_voice_options (
  sentence_template_id,
  slot_key,
  voice_id,
  voice_name,
  voice_provider,
  model_id,
  sort_order,
  is_default,
  is_active
)
select
  sta.sentence_template_id,
  case
    when sta.voice_role = 'male' then 'voice_a'
    else sta.voice_role
  end as slot_key,
  sta.voice_id,
  case
    when sta.voice_role = 'male' then 'roger'
    else sta.voice_role
  end as voice_name,
  'elevenlabs' as voice_provider,
  sta.model_id,
  case
    when sta.voice_role = 'male' then 1
    else 100
  end as sort_order,
  case
    when sta.voice_role = 'male' then true
    else false
  end as is_default,
  true as is_active
from public.sentence_template_audios sta
where not exists (
  select 1
  from public.sentence_template_voice_options stvo
  where stvo.sentence_template_id = sta.sentence_template_id
    and stvo.slot_key = case
      when sta.voice_role = 'male' then 'voice_a'
      else sta.voice_role
    end
    and stvo.deleted_at is null
);

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
