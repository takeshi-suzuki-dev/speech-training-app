package com.takeshi.backend.auth;

import org.springframework.stereotype.Service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

@Service
public class FirebaseAuthService {

    public FirebaseToken verifyIdToken(String authorizationHeader) throws FirebaseAuthException {
        String idToken = extractBearerToken(authorizationHeader);
        return FirebaseAuth.getInstance().verifyIdToken(idToken);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new IllegalArgumentException("Authorization header is required.");
        }

        if (!authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization header must start with Bearer.");
        }

        return authorizationHeader.substring("Bearer ".length());
    }
}
