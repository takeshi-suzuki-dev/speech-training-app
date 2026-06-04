package com.takeshi.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.takeshi.backend.auth.FirebaseAuthService;
import com.takeshi.backend.dto.request.SaveSentenceCategoryRequest;
import com.takeshi.backend.dto.request.SaveSentenceTemplateRequest;
import com.takeshi.backend.dto.response.SentenceCategoryResponse;
import com.takeshi.backend.dto.response.SentenceTemplateResponse;
import com.takeshi.backend.dto.response.TrainingAttemptResponse;
import com.takeshi.backend.service.SentenceTemplateService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class SentenceTemplateController {
    private final SentenceTemplateService sentenceTemplateService;
    private final FirebaseAuthService firebaseAuthService;

    public SentenceTemplateController(
            SentenceTemplateService sentenceTemplateService,
            FirebaseAuthService firebaseAuthService) {
        this.sentenceTemplateService = sentenceTemplateService;
        this.firebaseAuthService = firebaseAuthService;
    }

    @GetMapping("/sentence-categories")
    public List<SentenceCategoryResponse> getCategories(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader)
            throws FirebaseAuthException {

        String firebaseUid = null;

        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
            firebaseUid = token.getUid();
        }

        return sentenceTemplateService.findCategories(firebaseUid);
    }

    @PostMapping("/sentence-categories")
    @ResponseStatus(HttpStatus.CREATED)
    public SentenceCategoryResponse createUserCategory(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody SaveSentenceCategoryRequest request)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        return sentenceTemplateService.createUserCategory(request, token.getUid());
    }

    @PutMapping("/sentence-categories/{categoryId}")
    public SentenceCategoryResponse updateUserCategory(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable UUID categoryId,
            @RequestBody SaveSentenceCategoryRequest request)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        return sentenceTemplateService.updateUserCategory(
                categoryId,
                request,
                token.getUid());
    }

    @GetMapping("/sentence-templates")
    public List<SentenceTemplateResponse> getTemplates(@RequestParam("categoryId") UUID categoryId) {
        return sentenceTemplateService.findTemplatesByCategoryId(categoryId);
    }

    @GetMapping("/user-sentence-templates")
    public List<SentenceTemplateResponse> getUserTemplates(
            @RequestHeader("Authorization") String authorizationHeader)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        return sentenceTemplateService.findUserTemplatesByFirebaseUid(token.getUid());
    }

    @GetMapping("/sentence-latest-scores")
    public List<TrainingAttemptResponse> findLatestBySentenceForClient(@RequestParam("clientId") UUID clientId) {
        return sentenceTemplateService.findLatestBySentenceForClient(clientId);
    }

    @DeleteMapping("/sentence-categories/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserCategory(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable UUID categoryId)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        sentenceTemplateService.deleteUserCategory(categoryId, token.getUid());
    }

    @PostMapping("/sentence-templates")
    @ResponseStatus(HttpStatus.CREATED)
    public SentenceTemplateResponse createUserTemplate(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody SaveSentenceTemplateRequest request)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        return sentenceTemplateService.createUserTemplate(request, token.getUid());
    }

    @PutMapping("/sentence-templates/{templateId}")
    public SentenceTemplateResponse updateUserTemplate(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable UUID templateId,
            @RequestBody SaveSentenceTemplateRequest request)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        return sentenceTemplateService.updateUserTemplate(templateId, request, token.getUid());
    }

    @DeleteMapping("/sentence-templates/{templateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserTemplate(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable UUID templateId)
            throws FirebaseAuthException {

        FirebaseToken token = firebaseAuthService.verifyIdToken(authorizationHeader);
        sentenceTemplateService.deleteUserTemplate(templateId, token.getUid());
    }
}
