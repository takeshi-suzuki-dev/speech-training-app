package com.takeshi.backend.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sentence_templates")
public class SentenceTemplate {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "owner_firebase_uid")
    private String ownerFirebaseUid;

    @Column(name = "template_key", unique = true)
    private String templateKey;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "display_text", nullable = false, columnDefinition = "text")
    private String displayText;

    @Column(name = "scoring_text", nullable = false, columnDefinition = "text")
    private String scoringText;

    @Column(name = "sample_audio_text", nullable = false, columnDefinition = "text")
    private String sampleAudioText;

    @Column(name = "difficulty", nullable = false)
    private String difficulty;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean active;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected SentenceTemplate() {
    }

    public UUID getId() {
        return id;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public String getOwnerFirebaseUid() {
        return ownerFirebaseUid;
    }

    public String getTemplateKey() {
        return templateKey;
    }

    public String getTitle() {
        return title;
    }

    public String getDisplayText() {
        return displayText;
    }

    public String getScoringText() {
        return scoringText;
    }

    public String getSampleAudioText() {
        return sampleAudioText;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
