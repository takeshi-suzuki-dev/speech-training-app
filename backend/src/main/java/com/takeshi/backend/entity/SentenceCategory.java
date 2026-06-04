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
@Table(name = "sentence_categories")
public class SentenceCategory {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "category_key", unique = true)
    private String categoryKey;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "description")
    private String description;

    @Column(name = "owner_firebase_uid")
    private String ownerFirebaseUid;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean active;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected SentenceCategory() {
    }

    public SentenceCategory(
            String displayName,
            String description,
            String ownerFirebaseUid,
            Integer sortOrder) {
        this.categoryKey = null;
        this.displayName = displayName;
        this.description = description;
        this.ownerFirebaseUid = ownerFirebaseUid;
        this.sortOrder = sortOrder;
        this.active = true;
    }

    public UUID getId() {
        return id;
    }

    public String getCategoryKey() {
        return categoryKey;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public String getOwnerFirebaseUid() {
        return ownerFirebaseUid;
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

    public void deactivate() {
        this.active = false;
    }

    public void update(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

}
