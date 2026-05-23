package com.takeshi.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.takeshi.backend.entity.TemplateFavorite;
import com.takeshi.backend.repository.TemplateFavoriteRepository;

@Service
public class TemplateFavoriteService {

    private final TemplateFavoriteRepository templateFavoriteRepository;

    public TemplateFavoriteService(TemplateFavoriteRepository templateFavoriteRepository) {
        this.templateFavoriteRepository = templateFavoriteRepository;
    }

    @Transactional(readOnly = true)
    public List<UUID> findFavoriteTemplateIds(String userId) {
        return templateFavoriteRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(TemplateFavorite::getSentenceTemplateId)
                .toList();
    }

    @Transactional
    public void addFavorite(String userId, UUID sentenceTemplateId) {
        if (templateFavoriteRepository.existsByUserIdAndSentenceTemplateId(userId, sentenceTemplateId)) {
            return;
        }

        templateFavoriteRepository.save(new TemplateFavorite(userId, sentenceTemplateId));
    }

    @Transactional
    public void removeFavorite(String userId, UUID sentenceTemplateId) {
        templateFavoriteRepository.deleteByUserIdAndSentenceTemplateId(userId, sentenceTemplateId);
    }
}