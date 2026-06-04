package com.takeshi.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.takeshi.backend.entity.SentenceTemplate;

public interface SentenceTemplateRepository extends JpaRepository<SentenceTemplate, UUID> {
    List<SentenceTemplate> findByCategoryIdAndActiveTrueOrderBySortOrderAsc(UUID categoryId);

    List<SentenceTemplate> findByOwnerFirebaseUidAndActiveTrueOrderBySortOrderAsc(String ownerFirebaseUid);

    List<SentenceTemplate> findByCategoryIdAndOwnerFirebaseUidAndActiveTrueOrderBySortOrderAsc(
            UUID categoryId,
            String ownerFirebaseUid);

    Optional<SentenceTemplate> findByIdAndOwnerFirebaseUidAndActiveTrue(
            UUID id,
            String ownerFirebaseUid);

    @Query("""
            select coalesce(max(t.sortOrder), -1)
            from SentenceTemplate t
            where t.categoryId = :categoryId
              and t.ownerFirebaseUid = :ownerFirebaseUid
            """)
    Integer findMaxSortOrderByCategoryIdAndOwnerFirebaseUid(
            @Param("categoryId") UUID categoryId,
            @Param("ownerFirebaseUid") String ownerFirebaseUid);
}
