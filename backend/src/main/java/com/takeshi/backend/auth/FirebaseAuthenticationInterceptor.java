package com.takeshi.backend.auth;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class FirebaseAuthenticationInterceptor implements HandlerInterceptor {

    public static final String FIREBASE_UID_ATTRIBUTE = "firebaseUid";
    public static final String FIREBASE_EMAIL_ATTRIBUTE = "firebaseEmail";

    private final FirebaseAuthService firebaseAuthService;

    public FirebaseAuthenticationInterceptor(FirebaseAuthService firebaseAuthService) {
        this.firebaseAuthService = firebaseAuthService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        try {
            String authorizationHeader = request.getHeader("Authorization");
            FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);

            request.setAttribute(FIREBASE_UID_ATTRIBUTE, token.getUid());
            request.setAttribute(FIREBASE_EMAIL_ATTRIBUTE, token.getEmail());

            return true;
        } catch (IllegalArgumentException | FirebaseAuthException exception) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json");
            response.getWriter().write("""
                    {
                      "error": "UNAUTHORIZED",
                      "message": "Firebase authentication is required."
                    }
                    """);
            return false;
        }
    }
}