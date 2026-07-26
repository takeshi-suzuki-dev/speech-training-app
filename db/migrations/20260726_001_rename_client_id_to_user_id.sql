-- Rename training_attempts.client_id to user_id.
--
-- Background:
--   client_id used to hold a UUID generated in the browser and stored in
--   localStorage, which meant history was tied to a device and could be
--   requested for any other user's id. It is now derived server-side from the
--   authenticated Firebase UID (see auth/UserIdentity), so "user_id" is the
--   accurate name. The old nullable user_id column was never populated.
--
-- Deploy note: apply together with the matching application release.

alter table public.training_attempts
  drop column if exists user_id;

alter table public.training_attempts
  rename column client_id to user_id;
