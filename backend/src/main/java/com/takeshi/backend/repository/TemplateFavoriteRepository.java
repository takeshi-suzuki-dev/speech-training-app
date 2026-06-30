package com.takeshi.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.takeshi.backend.entity.TemplateFavorite;
import com.takeshi.backend.entity.TemplateFavoriteId;

public interface TemplateFavoriteRepository extends JpaRepository<TemplateFavorite, TemplateFavoriteId> {

    List<TemplateFavorite> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByUserIdAndSentenceTemplateId(String userId, UUID sentenceTemplateId);

    void deleteByUserIdAndSentenceTemplateId(String userId, UUID sentenceTemplateId);

    void deleteBySentenceTemplateIdIn(List<UUID> sentenceTemplateIds);
}
