package com.takeshi.backend.auth;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.firebase.auth.FirebaseToken;
import com.takeshi.backend.entity.AppAllowedUser;
import com.takeshi.backend.exception.AppAccessDeniedException;
import com.takeshi.backend.repository.AppAllowedUserRepository;

@Service
public class AppAccessService {

    private final AppAllowedUserRepository appAllowedUserRepository;

    public AppAccessService(AppAllowedUserRepository appAllowedUserRepository) {
        this.appAllowedUserRepository = appAllowedUserRepository;
    }

    @Transactional
    public AppAllowedUser requireAllowedUser(FirebaseToken token) {
        String email = token.getEmail();

        if (email == null || email.isBlank()) {
            throw new AppAccessDeniedException("Google email is required.");
        }

        if (!token.isEmailVerified()) {
            throw new AppAccessDeniedException("Verified Google email is required.");
        }

        AppAllowedUser allowedUser = appAllowedUserRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(
                        () -> new AppAccessDeniedException(
                                "This demo is available upon request."));

        if (!allowedUser.isCurrentlyAllowed(OffsetDateTime.now())) {
            throw new AppAccessDeniedException("Demo access is inactive or expired.");
        }

        if (allowedUser.getFirebaseUid() == null || allowedUser.getFirebaseUid().isBlank()) {
            allowedUser.linkFirebaseUid(token.getUid());
        } else if (!allowedUser.getFirebaseUid().equals(token.getUid())) {
            throw new AppAccessDeniedException(
                    "This Google account does not match the registered Firebase user.");
        }

        return allowedUser;
    }
}