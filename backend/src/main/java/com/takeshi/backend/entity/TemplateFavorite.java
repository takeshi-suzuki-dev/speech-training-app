package com.takeshi.backend.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "template_favorites")
@IdClass(TemplateFavoriteId.class)
public class TemplateFavorite {
    @Id
    @Column(name = "user_id", nullable = false)
    private String userId;

    @Id
    @Column(name = "sentence_template_id", nullable = false)
    private UUID sentenceTemplateId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected TemplateFavorite() {
    }

    public TemplateFavorite(String userId, UUID sentenceTemplateId) {
        this.userId = userId;
        this.sentenceTemplateId = sentenceTemplateId;
    }

    public String getUserId() {
        return userId;
    }

    public UUID getSentenceTemplateId() {
        return sentenceTemplateId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
