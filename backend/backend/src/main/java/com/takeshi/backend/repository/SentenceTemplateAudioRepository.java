package com.takeshi.backend.repository;

import com.takeshi.backend.entity.SentenceTemplateAudio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SentenceTemplateAudioRepository extends JpaRepository<SentenceTemplateAudio, UUID> {

    Optional<SentenceTemplateAudio> findBySentenceTemplateIdAndVoiceRole(
            UUID sentenceTemplateId,
            String voiceRole
    );
}
