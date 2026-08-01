package com.takeshi.backend.auth;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    public FirebaseAuthenticationInterceptor(
            FirebaseAuthService firebaseAuthService,
            AppAccessService appAccessService,
            ObjectMapper objectMapper) {
        this.firebaseAuthService = firebaseAuthService;
        this.appAccessService = appAccessService;
        this.objectMapper = objectMapper;
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
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        // Serialized rather than interpolated: a quote or newline in the
        // message would otherwise produce malformed JSON, and the client
        // would silently fall back to a generic wording instead of showing
        // the specific reason access was refused.
        objectMapper.writeValue(
                response.getWriter(),
                Map.of("error", error, "message", message == null ? "" : message));
    }
}