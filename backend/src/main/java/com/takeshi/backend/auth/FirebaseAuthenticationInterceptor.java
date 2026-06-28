package com.takeshi.backend.auth;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.takeshi.backend.entity.AppAllowedUser;
import com.takeshi.backend.exception.AppAccessDeniedException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class FirebaseAuthenticationInterceptor implements HandlerInterceptor {

    public static final String FIREBASE_UID_ATTRIBUTE = "firebaseUid";
    public static final String FIREBASE_EMAIL_ATTRIBUTE = "firebaseEmail";
    public static final String APP_USER_ROLE_ATTRIBUTE = "appUserRole";

    private final FirebaseAuthService firebaseAuthService;
    private final AppAccessService appAccessService;

    public FirebaseAuthenticationInterceptor(
            FirebaseAuthService firebaseAuthService,
            AppAccessService appAccessService) {
        this.firebaseAuthService = firebaseAuthService;
        this.appAccessService = appAccessService;
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
            AppAllowedUser allowedUser = appAccessService.requireAllowedUser(token);

            request.setAttribute(FIREBASE_UID_ATTRIBUTE, token.getUid());
            request.setAttribute(FIREBASE_EMAIL_ATTRIBUTE, token.getEmail());
            request.setAttribute(APP_USER_ROLE_ATTRIBUTE, allowedUser.getRole());

            return true;
        } catch (IllegalArgumentException | FirebaseAuthException exception) {
            writeJsonError(
                    response,
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "Firebase authentication is required.");
            return false;
        } catch (AppAccessDeniedException exception) {
            writeJsonError(
                    response,
                    HttpStatus.FORBIDDEN,
                    "ACCESS_NOT_ALLOWED",
                    exception.getMessage());
            return false;
        }
    }

    private void writeJsonError(
            HttpServletResponse response,
            HttpStatus status,
            String error,
            String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write("""
                {
                  "error": "%s",
                  "message": "%s"
                }
                """.formatted(error, message));
    }
}