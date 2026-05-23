package com.takeshi.backend.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class TemplateFavoriteId implements Serializable {

    private String userId;
    private UUID sentenceTemplateId;

    public TemplateFavoriteId() {
    }

    public TemplateFavoriteId(String userId, UUID sentenceTemplateId) {
        this.userId = userId;
        this.sentenceTemplateId = sentenceTemplateId;
    }

    public String getUserId() {
        return userId;
    }

    public UUID getSentenceTemplateId() {
        return sentenceTemplateId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof TemplateFavoriteId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId)
                && Objects.equals(sentenceTemplateId, that.sentenceTemplateId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, sentenceTemplateId);
    }
}