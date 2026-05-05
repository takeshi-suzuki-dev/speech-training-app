package com.takeshi.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.takeshi.backend.entity.SentenceCategory;

public interface SentenceCategoryRepository extends JpaRepository<SentenceCategory, UUID> {
    List<SentenceCategory> findByActiveTrueOrderBySortOrderAsc();
}
