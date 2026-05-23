package com.takeshi.backend.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final FirebaseAuthService firebaseAuthService;

    public AuthController(FirebaseAuthService firebaseAuthService) {
        this.firebaseAuthService = firebaseAuthService;
    }

    @GetMapping("/me")
    public AuthUserResponse me(@RequestHeader("Authorization") String authorizationHeader)
            throws FirebaseAuthException {
        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);

        return new AuthUserResponse(
                token.getUid(),
                token.getEmail());
    }

    @ExceptionHandler({ IllegalArgumentException.class, FirebaseAuthException.class })
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleAuthError(Exception exception) {
        return new ErrorResponse("UNAUTHORIZED", exception.getMessage());
    }

    public record AuthUserResponse(String uid, String email) {
    }

    public record ErrorResponse(String error, String message) {
    }
}