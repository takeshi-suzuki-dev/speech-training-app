# Phase 2 Controlled Demo Requirements

Last updated: 2026-06-28

> **Status: Implemented.** See [Phase 2 Current Status](phase-2-current-status.md) for what's actually built. This document is kept as the original requirements/policy reference; it is not updated line-by-line as implementation details evolve.

## Purpose

This application is currently intended to be used as:

- A private pronunciation training tool for English interview practice
- A controlled portfolio demo for recruiters and interviewers

The live application is not intended to be an open public SaaS product at this stage.

## Goals

The controlled demo should allow approved recruiters or interviewers to understand the technical value of the application without exposing private user data or allowing unrestricted usage.

The demo should show that the app includes:

- Google authentication
- User-defined practice categories
- User-defined sentence templates
- Audio recording in the browser
- Pronunciation assessment through Azure AI Speech
- Sample audio generation through ElevenLabs
- Score history and trend visualization
- User-specific data handling
- Backend access control

## Non-Goals

The following are not goals for this stage:

- Public SaaS launch
- Open sign-up for all users
- Anonymous app usage
- Shared demo account
- Subscription billing
- Payment integration
- Public user onboarding
- Unlimited pronunciation scoring
- Unlimited sample audio generation
- Production-scale monitoring

## Public Materials

The following materials can be public:

- GitHub repository
- README
- Architecture overview
- Screenshots
- Demo video
- Technical explanation

These materials should be enough for recruiters to understand the project even when the live app is not running.

## Restricted Live App

The live app should be available only upon request.

A recruiter or interviewer should not be able to use the app just because they know the URL.

The expected access flow is:

1. A recruiter requests access to the live demo.
2. They provide the Google email address they want to use for sign-in.
3. The email address is added to the application allowlist.
4. Demo access is enabled for a limited period.
5. The application URL is shared.
6. The live environment can be stopped after the demo period.

## Authentication and Authorization

Firebase Authentication is used to verify who the user is.

However, authentication alone is not enough.

The application also needs authorization to decide whether the signed-in user is allowed to use the live app.

The required policy is:

- Google sign-in is required.
- Only allowlisted users can access protected app features.
- Non-allowlisted users must be blocked.
- Expired demo users must be blocked.
- Disabled demo users must be blocked.

## User Roles

The first version only needs simple roles:

### OWNER

The owner is the developer of the application.

The owner can use the app for private English interview practice and development testing.

### DEMO_RECRUITER

A demo recruiter is an approved recruiter or interviewer.

A demo recruiter can access the live demo for a limited period.

At this stage, the role mainly represents access type. Fine-grained feature restrictions can be added later if necessary.

## Protected Data

The following data must be treated as protected:

- User-defined categories
- User-defined sentence templates
- Interview practice sentences
- Generated sample audio for user-defined sentences
- Pronunciation assessment results
- Score history
- Trend data
- Any future free-answer interview practice data

## Access Control Requirements

Before the live app is shared with recruiters, the following requirements must be satisfied:

1. Protected backend APIs require Firebase authentication.
2. Signed-in users must be checked against the application allowlist.
3. Users not found in the allowlist must receive a 403 response.
4. Inactive users must receive a 403 response.
5. Users with expired access must receive a 403 response.
6. User-defined data must only be accessible by its owner.
7. Sample audio generation for user-defined templates must require owner access.
8. The frontend must handle unauthorized and forbidden states clearly.

## Sample Audio Requirements

Sample audio requires special care because user-defined templates may include private interview answers or career information.

For controlled demo readiness:

- Sample audio generation must require authentication.
- Sample audio generation must require allowlist access.
- User-defined template audio must require owner access.
- Other users must not be able to generate or retrieve audio for private user-defined templates.
- The implementation should avoid exposing private user-defined audio as unrestricted public resources.

A fully private storage design can be improved later, but the minimum requirement for this stage is to prevent unauthenticated, non-allowlisted, and non-owner access.

## Frontend Requirements

The frontend should:

- Require Google sign-in before using protected features.
- Attach Firebase ID tokens to backend API requests.
- Hide development-only token information.
- Avoid displaying Firebase ID tokens in the UI.
- Avoid logging Firebase ID tokens to the console.
- Show a clear message when access is not allowed.

Suggested forbidden message:

> This demo is available upon request. Please contact the developer if you need access.

## Backend Requirements

The backend should:

- Verify Firebase ID tokens for protected APIs.
- Check allowlist access after successful authentication.
- Return 401 when authentication is missing or invalid.
- Return 403 when the signed-in user is not allowed to use the app.
- Keep `/health` accessible without authentication for deployment health checks.
- Use environment-based CORS configuration for local and deployed environments.

## Demo Access Operation

When a recruiter requests access, the developer should:

1. Ask for the recruiter's Google email address.
2. Add the email address to `app_allowed_users`.
3. Set the role to `DEMO_RECRUITER`.
4. Set an expiration date.
5. Start the live app environment if needed.
6. Send the normal app URL.
7. Disable or let the access expire after the demo period.

A shared demo Google account should not be used.

## Completion Criteria

This controlled demo stage is considered complete when:

- Current status documentation exists.
- Controlled demo requirements are documented.
- README explains that Phase 2 is in progress.
- Development-only authentication UI is cleaned up.
- Frontend API calls attach Firebase ID tokens.
- Protected backend APIs require Firebase authentication.
- Allowlist access control is implemented.
- Non-allowlisted users are blocked.
- User-defined sample audio is protected by authentication, allowlist, and owner checks.
- The app is safer to share as a limited recruiter demo.
