insert into public.sentence_categories (category_key, display_name, description, sort_order, is_active)
values
  ('daily',     'Daily Chat',  'Everyday conversation phrases',         1, true),
  ('interview', 'Interview',   'Job interview and self-introduction',   2, true),
  ('tech',      'Tech Talk',   'Engineering and technical discussion',  3, true),
  ('portfolio', 'Portfolio',   'Phrases for portfolio demo and Q&A',    4, true)
on conflict (category_key) do nothing;
