package com.takeshi.backend.controller;

import com.takeshi.backend.dto.response.SentenceCategoryResponse;
import com.takeshi.backend.dto.response.SentenceTemplateResponse;
import com.takeshi.backend.service.SentenceTemplateService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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
}
