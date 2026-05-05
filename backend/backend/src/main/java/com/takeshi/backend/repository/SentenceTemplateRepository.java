package com.takeshi.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.takeshi.backend.entity.SentenceTemplate;

public interface SentenceTemplateRepository extends JpaRepository<SentenceTemplate, UUID> {
    List<SentenceTemplate> findByCategoryIdAndActiveTrueOrderBySortOrderAsc(UUID categoryId);
}
