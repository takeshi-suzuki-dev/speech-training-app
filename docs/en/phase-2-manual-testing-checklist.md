# Manual Testing Checklist

## 1. Purpose

This document defines the manual testing checklist for the Speech Training App as part of preparing it for a controlled portfolio demo.

The goal is not to achieve full automated test coverage at this stage.  
The goal is to confirm that the main user flows work correctly and that the application is safe enough to demonstrate to approved recruiters or interviewers.

## 2. Test Policy

At this stage, testing focuses on:

- Manual testing for major user flows
- Backend integration-style checks for important protected APIs
- Minimum smoke testing for the frontend
- Clear confirmation of authentication, authorization, and data ownership behavior

Large-scale unit test coverage is out of scope for this stage.

## 3. Test Environment

- Frontend: Next.js local development server
- Backend: Spring Boot local server
- Database: Supabase PostgreSQL
- Storage: Supabase Storage
- Authentication: Firebase / Google Sign-In
- Speech scoring: Azure AI Speech
- Sample audio generation: ElevenLabs

## 4. Preconditions

Before testing:

- Frontend can start without build errors.
- Backend can start without build errors.
- Supabase DB schema is up to date.
- Required environment variables are configured.
- Firebase authentication settings are configured.
- At least one OWNER user exists in `app_allowed_users`.
- At least one non-allowlisted Google account is available for access control testing.
- Preset categories and sentence templates exist.
- Sample audio metadata exists for preset templates.

## 5. Smoke Test

### ST-01: Frontend starts

Steps:

1. Start the frontend.
2. Open the application in a browser.

Expected result:

- The page loads without a runtime error.
- The account/login area is displayed.

### ST-02: Backend starts

Steps:

1. Start the backend.
2. Access the health endpoint.

Expected result:

- The backend responds successfully.
- No authentication is required for the health endpoint.

## 6. Authentication and Allowlist

### AUTH-01: Login with allowlisted Google account

Steps:

1. Open the app.
2. Click “Login with Google” in the hero (this scrolls to the Account section), or scroll there directly.
3. Click “Continue with Google”.
4. Login with an allowlisted Google account.

Expected result:

- Login succeeds.
- Because this is a fresh sign-in and the account is allowlisted, the app automatically redirects to `/pronunciation`.
- The signed-in email is visible (via the account menu on `/pronunciation`).
- Protected app features can be used.

### AUTH-02: Login with non-allowlisted Google account

Steps:

1. Open the app.
2. Login with a Google account that is not registered in `app_allowed_users`.
3. Access a protected feature.

Expected result:

- The user is blocked.
- The backend returns 403.
- The frontend shows a clear access-denied message.

### AUTH-03: Unauthenticated access to protected API

Steps:

1. Call a protected API without an Authorization header.

Expected result:

- The backend returns 401.
- Protected data is not returned.

### AUTH-04: Expired or inactive allowlisted user

Steps:

1. Set an allowlisted user to inactive or expired.
2. Login with that user.
3. Access a protected feature.

Expected result:

- The backend returns 403.
- The user cannot use the protected feature.

### AUTH-05: Google account no longer matches the linked Firebase UID

Steps:

1. Login once with an allowlisted user so their `app_allowed_users` row gets linked to a Firebase UID.
2. In the database, change that row's `firebase_uid` to a different value (simulating a mismatch, e.g. the allowlist email was later re-registered under a different Google account).
3. Login again with the original Google account and access a protected feature.

Expected result:

- The backend returns 403 with the message "This Google account does not match the registered Firebase user."
- The frontend displays this message clearly.
- The user cannot use the protected feature.

### AUTH-06: Returning to the landing page while already signed in

Steps:

1. While signed in with an allowlisted account on `/pronunciation`, click the “Cadence” logo in the top-left of the header.

Expected result:

- The app navigates to the landing page (`/`).
- The user is NOT automatically redirected back to `/pronunciation` (auto-redirect only fires right after a fresh sign-in).
- The Account section shows the signed-in email, a “Go to Pronunciation App” button, and a “Logout” button.

### AUTH-07: Logout from the app header

Steps:

1. On `/pronunciation` or `/history`, click the gray avatar icon in the top-right corner.
2. Click “Logout” in the dropdown that appears.

Expected result:

- The dropdown shows the signed-in email before logout.
- The user is signed out.
- The app navigates to the landing page (`/`).

## 7. Trial Access Request

### TRIAL-01: Submit a trial access request

Steps:

1. Open the app while signed out.
2. Scroll to the "Access" section.
3. Enter an email address (and optionally a message).
4. Click “Send trial request”.

Expected result:

- The default mail client opens with a pre-filled recipient, subject, and body containing the entered email/message.
- The form switches to a confirmation state indicating the email app should have opened.

## 8. Category Management

### CAT-01: Load visible categories

Steps:

1. Login with an allowlisted user.
2. Open the Practice page.

Expected result:

- Preset categories are displayed.
- User-owned categories are displayed if they exist.
- Other users’ private categories are not displayed.

### CAT-02: Create user category

Steps:

1. Click “New” category.
2. Enter category name and description.
3. Save.

Expected result:

- The category is created.
- The category appears in the category list.
- The category is owned by the signed-in Firebase UID.

### CAT-03: Update user category

Steps:

1. Select a user-created category.
2. Edit its name or description.
3. Save.

Expected result:

- The category is updated.
- The updated values remain after reload.

### CAT-04: Delete user category

Steps:

1. Select a user-created category that has sentence templates.
2. Delete the category.
3. Confirm the deletion dialog.

Expected result:

- The category disappears.
- Templates under the category disappear.
- Related generated sample audio cache is removed.
- Training history is not deleted.
- Deleted data does not remain visible in the UI.

## 9. Sentence Template Management

### TMP-01: Load templates by category

Steps:

1. Select a category.

Expected result:

- Active templates in the selected category are displayed.
- Deleted templates are not displayed.

### TMP-02: Create user template

Steps:

1. Select a user category.
2. Click “New” practice sentence.
3. Enter title, text, and difficulty.
4. Save.

Expected result:

- The template is created.
- The template appears in the selected category.
- Sample audio metadata is created for the template.

### TMP-03: Update user template

Steps:

1. Edit a user-created template.
2. Change the text.
3. Save.

Expected result:

- The template is updated.
- Cached sample audio is reset if sample audio text changed.
- The updated text is used for scoring.

### TMP-04: Delete user template

Steps:

1. Delete a user-created template.
2. Confirm the deletion dialog.

Expected result:

- The template disappears from the list.
- Related favorite rows are deleted.
- Related generated audio cache is deleted.
- Training history remains.

## 10. Favorites

### FAV-01: Add favorite

Steps:

1. Login.
2. Select a template.
3. Add it to favorites.

Expected result:

- The template is marked as favorite.
- The favorite state remains after reload.

### FAV-02: Remove favorite

Steps:

1. Remove a favorite template.

Expected result:

- The template is no longer marked as favorite.
- The favorite state remains removed after reload.

## 11. Sample Audio

### AUD-01: Play sample audio for preset template

Steps:

1. Select a preset template.
2. Click the sample audio play button.

Expected result:

- Audio is generated or loaded from cache.
- Audio plays successfully.
- Replaying the same template is faster after cache is available.

### AUD-02: Play sample audio for user template

Steps:

1. Select a user-created template.
2. Play sample audio.

Expected result:

- Authentication is required.
- Allowlist access is required.
- The owner can generate and play the audio.
- Other users cannot access private user template audio.

### AUD-03: Audio cache reset after template update

Steps:

1. Generate sample audio for a user template.
2. Edit the template text.
3. Save.
4. Play sample audio again.

Expected result:

- Old cached audio is not reused.
- New audio is generated from the updated text.

## 12. Pronunciation Assessment

### PRON-01: Record and score pronunciation

Steps:

1. Select a template.
2. Record audio.
3. Submit for scoring.

Expected result:

- Audio is sent to the backend.
- Azure pronunciation assessment is executed.
- Scores are displayed.
- Result is saved to history.

### PRON-02: No speech / invalid recognition

Steps:

1. Record silence or invalid audio.
2. Submit for scoring.

Expected result:

- A clear error or recognition status message is shown.
- Invalid result is not saved as normal training history.

## 13. History and Charts

### HIST-01: Latest score display

Steps:

1. Complete a pronunciation assessment.
2. Return to the practice page.

Expected result:

- The latest score for the template is updated.

### HIST-02: History trend display

Steps:

1. Open the History page.

Expected result:

- Trend data is displayed.
- Overall score trend is visible.
- Score breakdown trend is visible if data exists.

## 14. Known Limitations

The following items are known limitations at this stage:

- Multiple voice option support is mainly implemented at the database/design level; the feature itself is deferred to Phase 3.
- The current sample audio API does not yet accept a voice option identifier from the frontend.
- The UI does not yet show two sample audio play buttons.
- Production CORS configuration is not finalized (currently allows `http://localhost:3000` only).
- Full automated unit test coverage is intentionally out of scope for this stage; this manual checklist is the primary regression check.

## 15. Completion Criteria

Manual testing is complete when:

- Allowlisted users can use the main app features.
- Non-allowlisted users are blocked.
- Auto-redirect to `/pronunciation` happens only right after a fresh login, not on every visit while already signed in.
- Navigating back to the landing page and logging out both behave correctly.
- The trial access request form opens the mail client with the expected content.
- Categories and templates can be created, updated, and deleted.
- Favorites work correctly.
- Sample audio can be generated and replayed.
- Pronunciation scoring works.
- History and latest scores are updated.
- Deleted data does not remain visible or playable.
- Known limitations are documented clearly.
