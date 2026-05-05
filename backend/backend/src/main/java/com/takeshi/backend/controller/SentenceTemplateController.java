package com.takeshi.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.takeshi.backend.dto.response.SentenceCategoryResponse;
import com.takeshi.backend.dto.response.SentenceTemplateResponse;
import com.takeshi.backend.dto.response.TrainingAttemptResponse;
import com.takeshi.backend.service.SentenceTemplateService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class SentenceTemplateController {
    private final SentenceTemplateService sentenceTemplateService;

    public SentenceTemplateController(SentenceTemplateService sentenceTemplateService) {
        this.sentenceTemplateService = sentenceTemplateService;
    }

    @GetMapping("/sentence-categories")
    public List<SentenceCategoryResponse> getCategories() {
        return sentenceTemplateService.findCategories();
    }

    @GetMapping("/sentence-templates")
    public List<SentenceTemplateResponse> getTemplates(@RequestParam("categoryId") UUID categoryId) {
        return sentenceTemplateService.findTemplatesByCategoryId(categoryId);
    }

    @GetMapping("/sentence-latest-scores")
    public List<TrainingAttemptResponse> findLatestBySentenceForClient(@RequestParam("clientId") UUID clientId) {
        return sentenceTemplateService.findLatestBySentenceForClient(clientId);
    }
}
