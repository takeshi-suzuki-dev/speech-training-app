# Phase 2 Current Status

Last updated: 2026-07-05

## Summary

Phase 2 is now complete.

Phase 1 was completed as a fixed-template MVP. The application can load fixed practice categories and sentences, record audio in the browser, send the audio to the backend for Azure pronunciation assessment, save assessment results, generate Roger sample audio with ElevenLabs, reuse generated audio from Supabase Storage, and display score history and trend charts.

Phase 2 added Firebase authentication, an application-level allowlist, user-defined categories and sentence templates, favorites, and a landing page with a trial access request flow. Authentication and authorization are now consistently applied across all protected backend APIs.

The app is ready for a controlled recruiter demo, subject to finalizing production CORS configuration as part of deployment.

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

## Remaining Work

- Multiple sample-audio voice options are implemented at the database/design level (`sentence_template_voice_options`) but not yet exposed through the API or UI. This is deferred to Phase 3.
- Production CORS configuration is not yet finalized; the backend currently only allows `http://localhost:3000`. This needs to be updated once the frontend's production domain is known.
- Automated unit test coverage is intentionally minimal at this stage. A manual testing checklist (`phase-2-manual-testing-checklist.md`) is used as the primary regression check instead of chasing full coverage.

## Main Risk (Mitigated)

Previously, the main risk was that the live app could become accessible to anyone who knew the URL and could sign in with Google. This is now mitigated: Firebase Authentication alone is no longer sufficient to use the app, because `FirebaseAuthenticationInterceptor` enforces the allowlist check on every protected request before it reaches a controller.

The remaining operational risk is standard for any hosted demo: the CORS configuration and any deployment-specific environment variables must be set correctly before the production URL is shared.

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
