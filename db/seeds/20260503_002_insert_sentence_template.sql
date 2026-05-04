-- -------------------------------------------------------------
-- Daily Chat
-- -------------------------------------------------------------
insert into public.sentence_templates
  (category_id, template_key, title, display_text, scoring_text, sample_audio_text, difficulty, sort_order, is_active)
values
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_greeting_done',
    'Greeting',
    'Hi there. It''s all done.',
    'Hi there. It''s all done.',
    'Hi there. It''s all done.',
    'easy',
    1,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_meeting_tomorrow',
    'Schedule',
    'I''d like to schedule a meeting for tomorrow afternoon.',
    'I wanna schedule a meeting for tomorrow afternoon.',
    'I wanna schedule a meeting for tomorrow afternoon.',
    'medium',
    2,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_want_to_grab_lunch',
    'Lunch',
    'Do you want to grab lunch together?',
    'Do you wanna grab lunch together?',
    'Do you wanna grab lunch together?',
    'easy',
    3,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_let_me_check',
    'Follow-up',
    'Let me check my schedule and get back to you.',
    'Lemme check my schedule and get back to you.',
    'Lemme check my schedule and get back to you.',
    'medium',
    4,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_going_to_try',
    'Intention',
    'I''m going to try a different approach on this.',
    'I''m gonna try a different approach on this.',
    'I''m gonna try a different approach on this.',
    'easy',
    5,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_got_to_wrap_up',
    'Closing',
    'I''ve got to wrap up soon. Can we continue this tomorrow?',
    'I''ve gotta wrap up soon. Can we continue this tomorrow?',
    'I''ve gotta wrap up soon. Can we continue this tomorrow?',
    'medium',
    6,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'daily'),
    'daily_appreciate_feedback',
    'Appreciation',
    'I really appreciate your feedback on this.',
    'I really appreciate your feedback on this.',
    'I really appreciate your feedback on this.',
    'easy',
    7,
    true
  );


-- -------------------------------------------------------------
-- Interview
-- -------------------------------------------------------------
insert into public.sentence_templates
  (category_id, template_key, title, display_text, scoring_text, sample_audio_text, difficulty, sort_order, is_active)
values
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'interview_introduce_yourself',
    'Introduction',
    'I''m a backend engineer with over ten years of experience in Java and Spring Boot.',
    'I''m a backend engineer with over ten years of experience in Java and Spring Boot.',
    'I''m a backend engineer with over ten years of experience in Java and Spring Boot.',
    'medium',
    1,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'interview_strength',
    'Strength',
    $$One of my strengths is my ability to break down complex problems into manageable steps.$$,  -- using dollar escape
    $$One of my strengths is my ability to break down complex problems into manageable steps.$$,  -- using dollar escape
    $$One of my strengths is my ability to break down complex problems into manageable steps.$$,  -- using dollar escape
    'medium',
    2,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'interview_challenge',
    'Challenge',
    'I faced a significant challenge when our team had to migrate the entire system under a tight deadline.',
    'I faced a significant challenge when our team hadta migrate the entire system under a tight deadline.',
    'I faced a significant challenge when our team hadta migrate the entire system under a tight deadline.',
    'hard',
    3,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'interview_want_to_contribute',
    'Motivation',
    'I want to contribute to a global team and grow in an international environment.',
    'I wanna contribute to a global team and grow in an international environment.',
    'I wanna contribute to a global team and grow in an international environment.',
    'hard',
    4,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'interview_going_to_relocate',
    'Relocation',
    'I''m planning to relocate to Australia in mid-2027 following my visa approval.',
    'I''m planning to relocate to Australia in mid-2027 following my visa approval.',
    'I''m planning to relocate to Australia in mid-2027 following my visa approval.',
    'medium',
    5,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'interview'),
    'interview_question_for_them',
    'Question',
    'Could you tell me more about the team structure and how engineers collaborate day to day?',
    'Could you tell me more about the team structure and how engineers collaborate day to day?',
    'Could you tell me more about the team structure and how engineers collaborate day to day?',
    'hard',
    6,
    true
  );

-- -------------------------------------------------------------
-- Tech Talk
-- -------------------------------------------------------------
insert into public.sentence_templates
  (category_id, template_key, title, display_text, scoring_text, sample_audio_text, difficulty, sort_order, is_active)
values
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_rest_api',
    'REST API',
    'We designed a RESTful API with clearly separated concerns across each service layer.',
    'We designed a RESTful API with clearly separated concerns across each service layer.',
    'We designed a RESTful API with clearly separated concerns across each service layer.',
    'hard',
    1,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_code_review',
    'Code Review',
    'I noticed a potential null pointer issue in this method. Could we add a null check here?',
    'I noticed a potential null pointer issue in this method. Could we add a null check here?',
    'I noticed a potential null pointer issue in this method. Could we add a null check here?',
    'medium',
    2,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_pull_request',
    'Pull Request',
    'I''ve opened a pull request for the authentication refactor. It''s ready for review.',
    'I''ve opened a pull request for the authentication refactor. It''s ready for review.',
    'I''ve opened a pull request for the authentication refactor. It''s ready for review.',
    'medium',
    3,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_gonna_deploy',
    'Deploy',
    'We''re going to need to run the migration before we deploy to production.',
    'We''re gonna need to run the migration before we deploy to production.',
    'We''re gonna need to run the migration before we deploy to production.',
    'hard',
    4,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_wanna_discuss',
    'Discussion',
    'Do you want to discuss the acceptance criteria before we estimate the story points?',
    'Do you wanna discuss the acceptance criteria before we estimate the story points?',
    'Do you wanna discuss the acceptance criteria before we estimate the story points?',
    'hard',
    5,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_unit_test',
    'Testing',
    'I added unit tests for the edge cases we discussed in the last review.',
    'I added unit tests for the edge cases we discussed in the last review.',
    'I added unit tests for the edge cases we discussed in the last review.',
    'medium',
    6,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'tech'),
    'tech_lgtm',
    'Approval',
    'Looks good to me. I''ll approve the PR once the CI check passes.',
    'Looks good to me. I''ll approve the PR once the CI check passes.',
    'Looks good to me. I''ll approve the PR once the CI check passes.',
    'easy',
    7,
    true
  );


-- -------------------------------------------------------------
-- Portfolio
-- -------------------------------------------------------------
insert into public.sentence_templates
  (category_id, template_key, title, display_text, scoring_text, sample_audio_text, difficulty, sort_order, is_active)
values
  (
    (select id from public.sentence_categories where category_key = 'portfolio'),
    'portfolio_app_overview',
    'Overview',
    'This app helps users improve their English pronunciation through real-time scoring.',
    'This app helps users improve their English pronunciation through real-time scoring.',
    'This app helps users improve their English pronunciation through real-time scoring.',
    'medium',
    1,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'portfolio'),
    'portfolio_tech_stack',
    'Tech Stack',
    'The backend is built with Java and Spring Boot, and the frontend uses Next.js with TypeScript.',
    'The backend is built with Java and Spring Boot, and the frontend uses Next.js with TypeScript.',
    'The backend is built with Java and Spring Boot, and the frontend uses Next.js with TypeScript.',
    'hard',
    2,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'portfolio'),
    'portfolio_azure_scoring',
    'Azure',
    'Pronunciation assessment is powered by the Azure Speech SDK with phoneme-level scoring.',
    'Pronunciation assessment is powered by the Azure Speech SDK with phoneme-level scoring.',
    'Pronunciation assessment is powered by the Azure Speech SDK with phoneme-level scoring.',
    'hard',
    3,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'portfolio'),
    'portfolio_why_built',
    'Motivation',
    'I built this because I wanted to solve my own challenge of preparing for English job interviews.',
    'I built this ''cause I wanna solve my own challenge of preparing for English job interviews.',
    'I built this ''cause I wanna solve my own challenge of preparing for English job interviews.',
    'medium',
    4,
    true
  ),
  (
    (select id from public.sentence_categories where category_key = 'portfolio'),
    'portfolio_next_phase',
    'Roadmap',
    'In the next phase, I''m going to add a history screen with score trend graphs.',
    'In the next phase, I''m gonna add a history screen with score trend graphs.',
    'In the next phase, I''m gonna add a history screen with score trend graphs.',
    'medium',
    5,
    true
  );
