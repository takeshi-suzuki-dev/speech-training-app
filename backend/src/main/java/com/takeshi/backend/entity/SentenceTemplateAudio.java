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
@Table(name = "sentence_template_audios")
public class SentenceTemplateAudio {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "sentence_template_id", nullable = false)
    private UUID sentenceTemplateId;

    @Column(name = "voice_option_id")
    private UUID voiceOptionId;

    @Column(name = "voice_role", nullable = false)
    private String voiceRole;

    @Column(name = "voice_id", nullable = false)
    private String voiceId;

    @Column(name = "model_id")
    private String modelId;

    @Column(name = "audio_path")
    private String audioPath;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected SentenceTemplateAudio() {
    }

    public SentenceTemplateAudio(
            UUID sentenceTemplateId,
            String voiceRole,
            String voiceId,
            String modelId) {
        this.sentenceTemplateId = sentenceTemplateId;
        this.voiceRole = voiceRole;
        this.voiceId = voiceId;
        this.modelId = modelId;
        this.audioPath = null;
    }

    public UUID getId() {
        return id;
    }

    public UUID getSentenceTemplateId() {
        return sentenceTemplateId;
    }

    public UUID getVoiceOptionId() {
        return voiceOptionId;
    }

    public String getVoiceRole() {
        return voiceRole;
    }

    public String getVoiceId() {
        return voiceId;
    }

    public String getModelId() {
        return modelId;
    }

    public String getAudioPath() {
        return audioPath;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setAudioPath(String audioPath) {
        this.audioPath = audioPath;
    }

    public void setVoiceOptionId(UUID voiceOptionId) {
        this.voiceOptionId = voiceOptionId;
    }
}
