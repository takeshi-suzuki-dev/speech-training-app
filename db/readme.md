# Database SQL

SQL for the Supabase PostgreSQL database. Files are applied by hand through the Supabase SQL
Editor; a migration tool may be introduced in a later phase.

## Directories

Each directory answers a different question, and the difference decides where a new file belongs.

### `schema/` — what the database looks like now

The current shape of every table, as a single snapshot. It carries no history: running it against
an empty database produces the current structure directly, without replaying how it got there. When
a migration changes a table, update this snapshot to match.

### `seeds/` — the data the app needs to exist

Running every file in numeric order populates a database with the system content: the four seed
categories, their 25 sentences, and the audio rows those sentences need. It carries no history
either, so the files are numbered by dependency (a sentence needs its category first), not by date.

`sentence_template_voice_options` is deliberately not seeded. Nothing in the application reads or
maintains it — it is groundwork for the multiple-voice feature in Phase 3 — and data that no code
maintains does not stay true. Phase 3 will populate it alongside the code that keeps it in step.
See `docs/en/phase2-db-storage-design.md` section 4.2.

Seeds are idempotent. Re-running them changes nothing, because each insert is guarded by
`on conflict do nothing` or a `not exists` check. A seed must never delete: if a seed has to clear
the table before it can run, it is a migration wearing the wrong hat.

Seeds are also self-contained. A seed derives its rows from the seed data itself, not from whatever
happens to be in another table, so it produces the same result on an empty database as on a
populated one.

### `migrations/` — how the database changed over time

An append-only record, one file per change, named by date. Unlike the other two directories this is
history: files are not edited or removed once applied, because they describe something that already
happened. A migration may delete or rewrite data; that is what distinguishes it from a seed.

## Ownership and the allowlist

Seed categories and sentences have no `owner_firebase_uid`. That is what makes them shared,
read-only system content: the update and delete APIs resolve rows by owner, so they cannot match a
seed row. Anything a user creates carries their Firebase UID and is visible only to them.

`app_allowed_users` is not seeded either, for a different reason: the addresses are personal data,
they differ per environment, and this repository is public. `004_app_allowed_users.sql.example` is
a template — copy it, replace the addresses, and run it by hand.

Note that an empty `app_allowed_users` table locks everyone out, including the owner, because the
allowlist is checked on every protected request. A fresh deployment needs at least one row before
anyone can sign in.

## Setting up a database from scratch

1. Run `schema/schema.sql`.
2. Run every file in `seeds/` in numeric order.
3. Copy `seeds/004_app_allowed_users.sql.example`, fill in the addresses, and run it.

Migrations are not part of this: the schema snapshot already includes everything they did.
