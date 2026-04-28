alter table public.training_attempts
add column scored_at timestamp with time zone not null default now();