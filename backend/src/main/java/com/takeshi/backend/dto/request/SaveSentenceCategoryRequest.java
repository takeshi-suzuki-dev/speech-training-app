package com.takeshi.backend.dto.request;

public record SaveSentenceCategoryRequest(
        String displayName,
        String description) {
}