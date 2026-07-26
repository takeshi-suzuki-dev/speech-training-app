package com.takeshi.backend.auth;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import com.takeshi.backend.exception.AppAccessDeniedException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Derives the training-history user identifier from the authenticated user
 * instead of trusting a client-supplied value.
 *
 * <p>The same Firebase UID always yields the same UUID, so existing rows can be
 * migrated with a one-off UPDATE and history follows the user across devices.
 */
public final class UserIdentity {

    private UserIdentity() {
    }

    public static UUID resolve(HttpServletRequest request) {
        Object uid = request.getAttribute(
                FirebaseAuthenticationInterceptor.FIREBASE_UID_ATTRIBUTE);

        if (uid == null || uid.toString().isBlank()) {
            throw new AppAccessDeniedException("Authenticated user is required.");
        }

        return fromFirebaseUid(uid.toString());
    }

    public static UUID fromFirebaseUid(String firebaseUid) {
        return UUID.nameUUIDFromBytes(firebaseUid.getBytes(StandardCharsets.UTF_8));
    }
}
