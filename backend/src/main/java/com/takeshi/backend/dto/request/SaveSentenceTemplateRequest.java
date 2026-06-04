package com.takeshi.backend.dto.request;

import java.util.UUID;

public record SaveSentenceTemplateRequest(
        UUID categoryId,
        String title,
        String displayText,
        String scoringText,
        String sampleAudioText,
        String difficulty) {
}