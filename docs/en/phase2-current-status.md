# Phase 2 Current Status

Last updated: 2026-07-15

## Summary

Phase 2 is now complete.

Phase 1 was completed as a fixed-template MVP. The application can load fixed practice categories and sentences, record audio in the browser, send the audio to the backend for Azure pronunciation assessment, save assessment results, generate Roger sample audio with ElevenLabs, reuse generated audio from Supabase Storage, and display score history and trend charts.

Phase 2 added Firebase authentication, an application-level allowlist, user-defined categories and sentence templates, favorites, and a landing page with a trial access request flow. Authentication and authorization are now consistently applied across all protected backend APIs.

The app is deployed on AWS ECS/Fargate and ready for a controlled recruiter demo at https://d22r3g893vf4i5.cloudfront.net.

## Current Position

The app is currently positioned as:

- A private pronunciation training tool for English interview practice
- A portfolio project to demonstrate full-stack development skills
- Not a public SaaS product at this stage

## Completed

### Phase 1 MVP

- Fixed practice phrase categories
- Fixed practice sentences
- Browser audio recording
- Pronunciation assessment through Azure AI Speech
- Assessment result persistence
- Latest score display
- Daily score trend charts
- Moving average trend charts
- ElevenLabs sample audio generation
- Supabase PostgreSQL integration
- Supabase Storage integration

### Phase 2

- Firebase / Google authentication
- Application-level allowlist (`app_allowed_users`), checked on every protected request
- `FirebaseAuthenticationInterceptor` applied globally to `/api/**`, so authentication and allowlist checks cannot be skipped by adding a new controller
- 401 for missing/invalid authentication, 403 for authenticated-but-not-allowed (not found in allowlist, inactive, expired, or Firebase UID mismatch)
- First-login Firebase UID linking for allowlisted users, with mismatch detection on subsequent logins
- `GET /api/auth/me` as a single endpoint the frontend can call to resolve both authentication and allowlist status
- User-defined categories and sentence templates, scoped to the owner's Firebase UID
- Favorite templates
- Sample audio access control: preset templates are available to any allowlisted user; user-defined template audio requires owner access
- Category/template deletion cascades correctly: related sample audio cache (DB row and Supabase Storage file) and favorites are removed, while training history is preserved
- Frontend API client (`apiFetch`) that attaches Firebase ID tokens to all backend requests
- Landing page with hero, feature overview, "Under the hood" architecture diagram, and a trial access request form (opens the user's mail client with a pre-filled request)
- Account UI: sign-in, sign-out, and access-status handling in `AuthPanel`, with the backend's own denial message (e.g. "This demo is available upon request.") surfaced directly in the UI
- Auto-redirect to `/pronunciation` immediately after a successful, allowlisted login — but not on every subsequent visit while already signed in, so returning to the landing page (e.g. via the logo) shows the account status instead of bouncing the user away
- Account menu in the app header (`/pronunciation`, `/history`) showing the signed-in email, with a logout action that returns to the landing page
- Seed categories and sentences are read-only: they are shared system content with no owner, the update and delete APIs resolve rows by owner and reject them, and the UI withholds the edit affordance rather than offering an action the API will refuse. To change a seed sentence, create your own.
- Sentence listings are scoped to the caller: a category returns the ownerless seed sentences plus the caller's own, so one user's custom sentences are not visible to another
- Deliberate failures reach the client with the status the service chose. A catch-all handler that reported them all as 500 would discard that status, so `ResponseStatusException` is handled ahead of it
- The pronunciation page is split into hooks (`hooks/pronunciation/`) and presentational components (`components/pronunciation/`), with the page left to wire them together — see `frontend-architecture.md`
- Vitest + React Testing Library cover the shared pronunciation components, asserting handler wiring and per-variant rendering
- WCAG AA contrast pass across the pronunciation and history screens (edit/favorite icons, chart axis labels, section labels), mobile viewport fix (`min-h-dvh` instead of `min-h-screen`) to remove a black gap below content on mobile, and a clickable/toggleable legend on the score-breakdown chart

## Remaining Work

- Multiple sample-audio voice options are implemented at the database/design level (`sentence_template_voice_options`) but not yet exposed through the API or UI. This is deferred to Phase 3.
- Images are tagged `latest`, which makes it impossible to tell which build is running and allowed a stale image to be deployed once. Tagging by commit hash is the fix.
- Deployment is manual, following `infra/DEPLOY.md`. No pipeline yet.
- Automated coverage stops at the shared pronunciation components. The page, the hooks, and the backend have none, so the manual testing checklist (`phase2-manual-testing-checklist.md`) remains the primary regression check.

## Main Risk (Mitigated)

Previously, the main risk was that the live app could become accessible to anyone who knew the URL and could sign in with Google. This is now mitigated: Firebase Authentication alone is no longer sufficient to use the app, because `FirebaseAuthenticationInterceptor` enforces the allowlist check on every protected request before it reaches a controller.

The deployment risks anticipated here materialized as predicted and have been resolved. Firebase credentials did not resolve on Fargate, because ECS can inject secrets only as environment variables while the Admin SDK expects a file path; `FirebaseConfig` now reads the service account from `FIREBASE_CREDENTIALS_JSON` and falls back to Application Default Credentials locally. CORS also failed even though the deployed frontend and API share an origin, because browsers attach an `Origin` header to non-GET requests regardless; allowed origins now come from `CORS_ALLOWED_ORIGINS`.

One issue was not anticipated. Practice history was keyed on a browser-generated `client_id` that the backend accepted from the request without checking it belonged to the caller, so any authenticated user could read another user's history by supplying their id. The column is now `user_id`, derived server-side from the authenticated Firebase UID. See `deployment-architecture.md`.

The remaining operational risk is the Supabase free-tier connection cap of 15 session-mode clients, which a rolling deployment can still approach if the HikariCP pool size is raised.

## Out of Scope for This Stage

The following items are not required for the current controlled portfolio demo stage:

- Public SaaS launch
- Subscription billing
- Payment integration
- Plan-based limits
- Full public user registration
- Shared demo account
- Full interview free-answer mode
- Production-scale monitoring
- Multiple sample-audio voice options (deferred to Phase 3)
