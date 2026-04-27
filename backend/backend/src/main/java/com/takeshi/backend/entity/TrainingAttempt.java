package com.takeshi.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "training_attempts")
public class TrainingAttempt {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "mode", nullable = false)
    private String mode;

    @Column(name = "sentence_id")
    private UUID sentenceId;

    @Column(name = "reference_text", nullable = false, columnDefinition = "text")
    private String referenceText;

    @Column(name = "recognized_text", columnDefinition = "text")
    private String recognizedText;

    @Column(name = "overall_score")
    private BigDecimal overallScore;

    @Column(name = "accuracy_score")
    private BigDecimal accuracyScore;

    @Column(name = "fluency_score")
    private BigDecimal fluencyScore;

    @Column(name = "completeness_score")
    private BigDecimal completenessScore;

    @Column(name = "prosody_score")
    private BigDecimal prosodyScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "words_json", columnDefinition = "jsonb")
    private String wordsJson;

    @Column(name = "audio_duration_ms")
    private Integer audioDurationMs;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    protected TrainingAttempt() {
    }

    public TrainingAttempt(
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
        this.clientId = clientId;
        this.userId = userId;
        this.mode = mode;
        this.sentenceId = sentenceId;
        this.referenceText = referenceText;
        this.recognizedText = recognizedText;
        this.overallScore = overallScore;
        this.accuracyScore = accuracyScore;
        this.fluencyScore = fluencyScore;
        this.completenessScore = completenessScore;
        this.prosodyScore = prosodyScore;
        this.wordsJson = wordsJson;
        this.audioDurationMs = audioDurationMs;
    }

    public UUID getId() {
        return id;
    }

    public UUID getClientId() {
        return clientId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getMode() {
        return mode;
    }

    public UUID getSentenceId() {
        return sentenceId;
    }

    public String getReferenceText() {
        return referenceText;
    }

    public String getRecognizedText() {
        return recognizedText;
    }

    public BigDecimal getOverallScore() {
        return overallScore;
    }

    public BigDecimal getAccuracyScore() {
        return accuracyScore;
    }

    public BigDecimal getFluencyScore() {
        return fluencyScore;
    }

    public BigDecimal getCompletenessScore() {
        return completenessScore;
    }

    public BigDecimal getProsodyScore() {
        return prosodyScore;
    }

    public String getWordsJson() {
        return wordsJson;
    }

    public Integer getAudioDurationMs() {
        return audioDurationMs;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
