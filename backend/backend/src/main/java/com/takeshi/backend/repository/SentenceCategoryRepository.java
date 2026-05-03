package com.takeshi.backend.repository;

import com.takeshi.backend.entity.SentenceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SentenceCategoryRepository extends JpaRepository<SentenceCategory, UUID> {
    List<SentenceCategory> findByActiveTrueOrderBySortOrderAsc();
}
