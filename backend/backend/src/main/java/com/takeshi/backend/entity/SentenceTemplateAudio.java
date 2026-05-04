package com.takeshi.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

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

    public UUID getId() {
        return id;
    }

    public UUID getSentenceTemplateId() {
        return sentenceTemplateId;
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
}
