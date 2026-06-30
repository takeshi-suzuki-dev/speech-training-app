package com.takeshi.backend.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sentence_template_voice_options")
public class SentenceTemplateVoiceOption {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "sentence_template_id", nullable = false)
    private UUID sentenceTemplateId;

    @Column(name = "slot_key", nullable = false)
    private String slotKey;

    @Column(name = "voice_id", nullable = false)
    private String voiceId;

    @Column(name = "voice_name", nullable = false)
    private String voiceName;

    @Column(name = "voice_provider", nullable = false)
    private String voiceProvider;

    @Column(name = "model_id")
    private String modelId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "is_default", nullable = false)
    private Boolean defaultOption;

    @Column(name = "is_active", nullable = false)
    private Boolean active;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    protected SentenceTemplateVoiceOption() {
    }

    public UUID getId() {
        return id;
    }

    public UUID getSentenceTemplateId() {
        return sentenceTemplateId;
    }

    public String getSlotKey() {
        return slotKey;
    }

    public String getVoiceId() {
        return voiceId;
    }

    public String getVoiceName() {
        return voiceName;
    }

    public String getVoiceProvider() {
        return voiceProvider;
    }

    public String getModelId() {
        return modelId;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public Boolean getDefaultOption() {
        return defaultOption;
    }

    public Boolean getActive() {
        return active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public OffsetDateTime getDeletedAt() {
        return deletedAt;
    }

    public boolean isUsable() {
        return Boolean.TRUE.equals(active) && deletedAt == null;
    }

    public void deactivate(OffsetDateTime deletedAt) {
        this.active = false;
        this.deletedAt = deletedAt;
    }
}