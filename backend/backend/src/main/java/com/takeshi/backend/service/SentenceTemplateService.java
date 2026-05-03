package com.takeshi.backend.service;

import com.takeshi.backend.dto.response.SentenceCategoryResponse;
import com.takeshi.backend.dto.response.SentenceTemplateResponse;
import com.takeshi.backend.repository.SentenceCategoryRepository;
import com.takeshi.backend.repository.SentenceTemplateRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SentenceTemplateService {
    private final SentenceCategoryRepository sentenceCategoryRepository;
    private final SentenceTemplateRepository sentenceTemplateRepository;

    public SentenceTemplateService(
            SentenceCategoryRepository sentenceCategoryRepository,
            SentenceTemplateRepository sentenceTemplateRepository
    ) {
        this.sentenceCategoryRepository = sentenceCategoryRepository;
        this.sentenceTemplateRepository = sentenceTemplateRepository;
    }

    public List<SentenceCategoryResponse> findCategories() {
        return sentenceCategoryRepository.findByActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(SentenceCategoryResponse::from)
                .toList();
    }

    public List<SentenceTemplateResponse> findTemplatesByCategoryId(UUID categoryId) {
        return sentenceTemplateRepository.findByCategoryIdAndActiveTrueOrderBySortOrderAsc(categoryId)
                .stream()
                .map(SentenceTemplateResponse::from)
                .toList();
    }
}
