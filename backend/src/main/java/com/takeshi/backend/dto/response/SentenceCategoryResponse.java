package com.takeshi.backend.dto.response;

import java.util.UUID;

import com.takeshi.backend.entity.SentenceCategory;

public record SentenceCategoryResponse(
        UUID id,
        String categoryKey,
        String displayName,
        String description,
        Integer sortOrder,
        boolean userCategory) {
    public static SentenceCategoryResponse from(SentenceCategory category) {
        return new SentenceCategoryResponse(
                category.getId(),
                category.getCategoryKey(),
                category.getDisplayName(),
                category.getDescription(),
                category.getSortOrder(),
                category.getOwnerFirebaseUid() != null);
    }
}
