package com.takeshi.backend.dto.response;

import com.takeshi.backend.entity.SentenceTemplate;

import java.util.UUID;

public record SentenceTemplateResponse(
        UUID id,
        UUID categoryId,
        String templateKey,
        String title,
        String displayText,
        String scoringText,
        String sampleAudioText,
        String difficulty,
        Integer sortOrder
) {
    public static SentenceTemplateResponse from(SentenceTemplate template) {
        return new SentenceTemplateResponse(
                template.getId(),
                template.getCategoryId(),
                template.getTemplateKey(),
                template.getTitle(),
                template.getDisplayText(),
                template.getScoringText(),
                template.getSampleAudioText(),
                template.getDifficulty(),
                template.getSortOrder()
        );
    }
}
