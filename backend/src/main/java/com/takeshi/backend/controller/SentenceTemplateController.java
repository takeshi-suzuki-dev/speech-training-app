package com.takeshi.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.takeshi.backend.auth.FirebaseAuthService;
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
    public List<SentenceCategoryResponse> getCategories() {
        return sentenceTemplateService.findCategories();
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
}
