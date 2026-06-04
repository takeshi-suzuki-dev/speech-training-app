package com.takeshi.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.takeshi.backend.entity.SentenceCategory;

public interface SentenceCategoryRepository extends JpaRepository<SentenceCategory, UUID> {

    List<SentenceCategory> findByActiveTrueOrderBySortOrderAsc();

    Optional<SentenceCategory> findByIdAndOwnerFirebaseUidAndActiveTrue(
            UUID id,
            String ownerFirebaseUid);

    @Query("""
            select c
            from SentenceCategory c
            where c.active = true
              and (
                    c.ownerFirebaseUid is null
                    or c.ownerFirebaseUid = :ownerFirebaseUid
                  )
            order by c.sortOrder asc
            """)
    List<SentenceCategory> findVisibleCategories(
            @Param("ownerFirebaseUid") String ownerFirebaseUid);

    @Query("""
            select coalesce(max(c.sortOrder), -1)
            from SentenceCategory c
            where c.active = true
              and (
                    c.ownerFirebaseUid is null
                    or c.ownerFirebaseUid = :ownerFirebaseUid
                  )
            """)
    Integer findMaxSortOrderForVisibleCategories(
            @Param("ownerFirebaseUid") String ownerFirebaseUid);
}