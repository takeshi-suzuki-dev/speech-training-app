# Phase 2 Current Status

Last updated: 2026-06-28

## Summary

This branch is currently in the middle of Phase 2.

Phase 1 has already been completed as a fixed-template MVP. The application can load fixed practice categories and sentences, record audio in the browser, send the audio to the backend for Azure pronunciation assessment, save assessment results, generate Roger sample audio with ElevenLabs, reuse generated audio from Supabase Storage, and display score history and trend charts.

On the `feature/auth-user-templates` branch, Phase 2 features have been partially implemented. Firebase authentication, user-defined categories, user-defined sentence templates, and favorites have been introduced. However, authentication and access control are not yet consistently applied across the entire application.

The app should not be treated as ready for a recruiter live demo yet.

## Current Position

The app is currently positioned as:

- A private pronunciation training tool for English interview practice
- A portfolio project to demonstrate full-stack development skills
- Not a public SaaS product at this stage

## Completed or Partially Completed

### Phase 1 MVP

The following Phase 1 features are completed:

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

### Phase 2 Partial Implementation

The following Phase 2 features are partially implemented on this branch:

- Firebase / Google authentication
- User-defined categories
- User-defined sentence templates
- User-specific template operations
- Favorite templates
- Firebase UID based ownership for some user-defined data
- Some backend APIs that verify Firebase ID tokens

## Not Yet Completed

The following items are not yet complete enough for a controlled recruiter demo:

- Authentication is not consistently required for all protected APIs.
- Some APIs still allow unauthenticated or partially authenticated access.
- There is no allowlist yet for limiting live app access to approved users.
- Google sign-in currently does not mean the user is allowed to use the app.
- Pronunciation scoring and history still rely at least partly on browser-based `clientId`.
- Sample audio handling is still too public for user-defined private sentences.
- User-defined sample audio needs stronger access control.
- Recruiter demo access requirements are not yet documented in the README.
- Production CORS configuration is not yet finalized.
- The authentication UI still contains development/test-oriented behavior.

## Main Risk

The main risk is that the live app may become accessible to anyone who knows the URL and can sign in with Google.

For a controlled portfolio demo, Firebase Authentication alone is not enough. The app also needs application-level authorization, such as an allowlist, so that only approved users can access protected features.

## Target Before Recruiter Demo

Before sharing a live app URL with recruiters, the following must be completed:

1. Clean up the development authentication UI.
2. Add a shared frontend API client that attaches Firebase ID tokens.
3. Require Firebase authentication for protected backend APIs.
4. Add an `app_allowed_users` allowlist.
5. Block non-allowlisted users from using the app.
6. Protect sample audio generation and access for user-defined templates.
7. Ensure user-defined templates and audio cannot be accessed by other users.
8. Update README and documentation to explain the controlled demo approach.

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
