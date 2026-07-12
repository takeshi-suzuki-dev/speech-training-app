package com.takeshi.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.takeshi.backend.entity.SentenceTemplate;

public interface SentenceTemplateRepository extends JpaRepository<SentenceTemplate, UUID> {

    List<SentenceTemplate> findByOwnerFirebaseUidAndActiveTrueOrderBySortOrderAsc(String ownerFirebaseUid);

    List<SentenceTemplate> findByCategoryIdAndOwnerFirebaseUidAndActiveTrueOrderBySortOrderAsc(
            UUID categoryId,
            String ownerFirebaseUid);

    Optional<SentenceTemplate> findByIdAndOwnerFirebaseUidAndActiveTrue(
            UUID id,
            String ownerFirebaseUid);

    /**
     * The sentences a caller may see in a category: the ownerless seed sentences, which are shared
     * system content, plus the caller's own.
     *
     * <p>The owner predicate is what keeps one user's custom sentences out of another's list, so
     * every listing must go through this query rather than filter by category alone. Mirrors
     * {@code SentenceCategoryRepository#findVisibleCategories}.
     */
    @Query("""
            select t
            from SentenceTemplate t
            where t.active = true
              and t.categoryId = :categoryId
              and (
                    t.ownerFirebaseUid is null
                    or t.ownerFirebaseUid = :ownerFirebaseUid
                  )
            order by t.sortOrder asc
            """)
    List<SentenceTemplate> findVisibleTemplatesByCategoryId(
            @Param("categoryId") UUID categoryId,
            @Param("ownerFirebaseUid") String ownerFirebaseUid);

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
