-- Empties sentence_template_voice_options, and records on each audio row which TTS model it uses.
--
-- The voice-option table is groundwork for the multiple-voice feature in Phase 3. No code reads it,
-- writes it, or keeps it in step with the sentences. It was populated once by copying
-- sentence_template_audios row by row, and the copy went stale immediately: sentences created after
-- the copy got no row, and rows created through the app carried a null model_id. Data that nothing
-- maintains does not stay true, so the table is cleared rather than repaired. Phase 3 will populate
-- it alongside the code that maintains it. See docs/en/phase2-db-storage-design.md section 4.2.
--
-- sentence_template_audios.voice_option_id references this table with on delete restrict, so the
-- references have to be dropped before the rows can go. They stay null until Phase 3.

-- 1. Drop the references. Without this the delete below is refused by the foreign key.
update public.sentence_template_audios
set voice_option_id = null
where voice_option_id is not null;

-- 2. Empty the table. Delete rather than truncate: truncate would be blocked by the same foreign
--    key, and the row count here is trivial.
delete from public.sentence_template_voice_options;

-- 3. Record the model on the audio rows that were created without one.
--    Audio rows created through the app passed a null model_id, and TtsService quietly substituted
--    its default, so generation worked while the row recorded nothing about what produced it. The
--    seeds always set it; only the app-created rows are affected. Fixed at the source in
--    SentenceTemplateService, which now passes TtsService.DEFAULT_MODEL_ID.
update public.sentence_template_audios
set model_id = 'eleven_multilingual_v2'
where model_id is null or model_id = '';
