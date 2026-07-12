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
         * Whether the caller owns this sentence, and so may edit or delete it.
         *
         * <p>Seed sentences are shared system content with no owner, and update and delete resolve
         * the row by owner, so they cannot be modified. The client needs to know this to withhold
         * the edit affordance rather than offer an action the API will refuse. Mirrors
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
