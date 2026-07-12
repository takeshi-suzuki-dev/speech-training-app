-- Removes the seed sentence 'interview_going_to_relocate'.
--
-- The sentence stated a private relocation plan — a destination, a date, and a visa status — in a
-- public repository. It is dropped rather than reworded: the Interview category already covers the
-- same ground with interview_want_to_contribute, and a practice sentence is not worth publishing
-- personal circumstances for.
--
-- The audio row and any favorite are removed by cascade. Practice history survives:
-- training_attempts.sentence_id is on delete set null, and each attempt keeps its own copy of the
-- sentence in reference_text, so past scores stay in the history charts.

delete from public.sentence_templates
where template_key = 'interview_going_to_relocate';

-- Close the gap the deletion leaves in the Interview category's ordering.
update public.sentence_templates
set sort_order = 5
where template_key = 'interview_question_for_them';
