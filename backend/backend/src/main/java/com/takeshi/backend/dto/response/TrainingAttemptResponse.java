package com.takeshi.backend.dto.response;

import com.takeshi.backend.entity.TrainingAttempt;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TrainingAttemptResponse(
        UUID id,
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
        Integer audioDurationMs,
        OffsetDateTime scoredAt,
        OffsetDateTime createdAt
) {
    public static TrainingAttemptResponse from(TrainingAttempt attempt) {
        return new TrainingAttemptResponse(
                attempt.getId(),
                attempt.getClientId(),
                attempt.getUserId(),
                attempt.getMode(),
                attempt.getSentenceId(),
                attempt.getReferenceText(),
                attempt.getRecognizedText(),
                attempt.getOverallScore(),
                attempt.getAccuracyScore(),
                attempt.getFluencyScore(),
                attempt.getCompletenessScore(),
                attempt.getProsodyScore(),
                attempt.getWordsJson(),
                attempt.getAudioDurationMs(),
                attempt.getScoredAt(),
                attempt.getCreatedAt()
        );
    }
}
