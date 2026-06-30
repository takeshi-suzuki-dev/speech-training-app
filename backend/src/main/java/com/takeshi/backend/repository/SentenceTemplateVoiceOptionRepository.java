package com.takeshi.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.takeshi.backend.entity.SentenceTemplateVoiceOption;

public interface SentenceTemplateVoiceOptionRepository
        extends JpaRepository<SentenceTemplateVoiceOption, UUID> {

    List<SentenceTemplateVoiceOption> findBySentenceTemplateIdAndDeletedAtIsNullOrderBySortOrderAsc(
            UUID sentenceTemplateId);

    Optional<SentenceTemplateVoiceOption> findBySentenceTemplateIdAndSlotKeyAndDeletedAtIsNull(
            UUID sentenceTemplateId,
            String slotKey);

    Optional<SentenceTemplateVoiceOption> findBySentenceTemplateIdAndDefaultOptionTrueAndDeletedAtIsNull(
            UUID sentenceTemplateId);

    List<SentenceTemplateVoiceOption> findBySentenceTemplateIdInAndDeletedAtIsNull(
            List<UUID> sentenceTemplateIds);
}