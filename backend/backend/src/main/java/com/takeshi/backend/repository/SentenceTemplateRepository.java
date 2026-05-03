package com.takeshi.backend.repository;

import com.takeshi.backend.entity.SentenceTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SentenceTemplateRepository extends JpaRepository<SentenceTemplate, UUID> {
    List<SentenceTemplate> findByCategoryIdAndActiveTrueOrderBySortOrderAsc(UUID categoryId);
}
