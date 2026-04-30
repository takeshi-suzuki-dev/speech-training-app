insert into public.sentence_categories (
  category_key,
  display_name,
  description,
  sort_order,
  is_active
)
values
  (
    'daily',
    'Daily Conversation',
    'Short phrases for daily conversation.',
    10,
    true
  ),
  (
    'interview',
    'Interview',
    'Phrases for job interview practice.',
    20,
    true
  ),
  (
    'tech',
    'Tech Phrases',
    'Phrases for software engineering conversations.',
    30,
    true
  ),
  (
    'portfolio',
    'Portfolio Explanation',
    'Phrases for explaining the portfolio app.',
    40,
    true
  )
on conflict (category_key)
do update set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
