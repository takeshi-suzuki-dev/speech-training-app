package com.takeshi.backend.dto.response;

import com.takeshi.backend.entity.SentenceCategory;

import java.util.UUID;

public record SentenceCategoryResponse(
        UUID id,
        String categoryKey,
        String displayName,
        String description,
        Integer sortOrder
) {
    public static SentenceCategoryResponse from(SentenceCategory category) {
        return new SentenceCategoryResponse(
                category.getId(),
                category.getCategoryKey(),
                category.getDisplayName(),
                category.getDescription(),
                category.getSortOrder()
        );
    }
}
