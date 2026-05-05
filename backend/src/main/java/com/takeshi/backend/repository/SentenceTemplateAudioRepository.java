package com.takeshi.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.takeshi.backend.entity.SentenceTemplateAudio;

public interface SentenceTemplateAudioRepository extends JpaRepository<SentenceTemplateAudio, UUID> {

    Optional<SentenceTemplateAudio> findBySentenceTemplateIdAndVoiceRole(UUID sentenceTemplateId, String voiceRole);
}
