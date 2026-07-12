package com.takeshi.backend.dto.response;

import java.util.UUID;

import com.takeshi.backend.entity.SentenceTemplate;

public record SentenceTemplateResponse(
        UUID id,
        UUID categoryId,
        String templateKey,
        String title,
        String displayText,
        String scoringText,
        String sampleAudioText,
        String difficulty,
        Integer sortOrder,
        /**
         * True when the signed-in user owns this template, i.e. it is editable.
         *
         * <p>Seed templates are system content and have no owner, so they are read-only: update and
         * delete look the row up by owner and would reject them. Exposing ownership lets the client
         * hide the edit affordance instead of offering an action the API will refuse. Mirrors
         * {@code userCategory} on {@link SentenceCategoryResponse}.
         */
        boolean userTemplate) {
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
                template.getSortOrder(),
                template.getOwnerFirebaseUid() != null);
    }
}
