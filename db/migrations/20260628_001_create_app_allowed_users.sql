create table if not exists public.app_allowed_users (
    id bigserial primary key,
    email text not null,
    firebase_uid text unique,
    role text not null,
    is_active boolean not null default true,
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint app_allowed_users_role_check
        check (role in ('OWNER', 'DEMO_RECRUITER'))
);

create unique index if not exists idx_app_allowed_users_lower_email
    on public.app_allowed_users (lower(email));

create index if not exists idx_app_allowed_users_firebase_uid
    on public.app_allowed_users (firebase_uid);
