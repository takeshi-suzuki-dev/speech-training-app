package com.takeshi.backend.dto.request;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateTrainingAttemptRequest(
        UUID clientId,
        UUID userId,
        String mode,
        UUID sentenceId,
        String referenceText,
        String recognizedText,
        BigDecimal overallScore,
        BigDecimal accuracyScore,
        BigDecimal fluencyScore,
        BigDecimal completenessScore,
        BigDecimal prosodyScore,
        String wordsJson,
        Integer audioDurationMs
) {
}
