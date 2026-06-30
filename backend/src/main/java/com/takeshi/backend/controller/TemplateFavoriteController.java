package com.takeshi.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.takeshi.backend.auth.FirebaseAuthService;
import com.takeshi.backend.service.TemplateFavoriteService;

@RestController
@RequestMapping("/api/template-favorites")
@CrossOrigin(origins = "http://localhost:3000")
public class TemplateFavoriteController {

    private final FirebaseAuthService firebaseAuthService;
    private final TemplateFavoriteService templateFavoriteService;

    public TemplateFavoriteController(
            FirebaseAuthService firebaseAuthService,
            TemplateFavoriteService templateFavoriteService) {
        this.firebaseAuthService = firebaseAuthService;
        this.templateFavoriteService = templateFavoriteService;
    }

    @GetMapping
    public List<UUID> getFavoriteTemplateIds(
            @RequestHeader("Authorization") String authorizationHeader)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        return templateFavoriteService.findFavoriteTemplateIds(token.getUid());
    }

    @PostMapping("/{templateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addFavorite(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable UUID templateId)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        templateFavoriteService.addFavorite(token.getUid(), templateId);
    }

    @DeleteMapping("/{templateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavorite(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable UUID templateId)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        templateFavoriteService.removeFavorite(token.getUid(), templateId);
    }

    @ExceptionHandler({ IllegalArgumentException.class, FirebaseAuthException.class })
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleAuthError(Exception exception) {
        return new ErrorResponse("UNAUTHORIZED", exception.getMessage());
    }

    public record ErrorResponse(String error, String message) {
    }
}