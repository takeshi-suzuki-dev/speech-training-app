package com.takeshi.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.takeshi.backend.dto.response.SentenceCategoryResponse;
import com.takeshi.backend.dto.response.SentenceTemplateResponse;
import com.takeshi.backend.dto.response.TrainingAttemptResponse;
import com.takeshi.backend.repository.SentenceCategoryRepository;
import com.takeshi.backend.repository.SentenceTemplateRepository;
import com.takeshi.backend.repository.TrainingAttemptRepository;

@Service
public class SentenceTemplateService {
    private final SentenceCategoryRepository sentenceCategoryRepository;
    private final SentenceTemplateRepository sentenceTemplateRepository;
    private final TrainingAttemptRepository trainingAttemptRepository;

    public SentenceTemplateService(
            SentenceCategoryRepository sentenceCategoryRepository,
            SentenceTemplateRepository sentenceTemplateRepository,
            TrainingAttemptRepository trainingAttemptRepository) {
        this.sentenceCategoryRepository = sentenceCategoryRepository;
        this.sentenceTemplateRepository = sentenceTemplateRepository;
        this.trainingAttemptRepository = trainingAttemptRepository;
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

    @Transactional(readOnly = true)
    public List<TrainingAttemptResponse> findLatestBySentenceForClient(UUID clientId) {
        return trainingAttemptRepository.findLatestBySentenceIdForClient(clientId)
                .stream()
                .map(TrainingAttemptResponse::from)
                .toList();
    }

}
