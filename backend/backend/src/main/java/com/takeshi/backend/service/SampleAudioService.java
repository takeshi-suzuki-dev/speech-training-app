package com.takeshi.backend.service;

import com.takeshi.backend.dto.response.SampleAudioResponse;
import com.takeshi.backend.entity.SentenceTemplate;
import com.takeshi.backend.entity.SentenceTemplateAudio;
import com.takeshi.backend.repository.SentenceTemplateAudioRepository;
import com.takeshi.backend.repository.SentenceTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class SampleAudioService {

    private static final String PHASE1_VOICE_ROLE = "male";
    private static final String PHASE1_VOICE_NAME = "roger";

    private final SentenceTemplateRepository sentenceTemplateRepository;
    private final SentenceTemplateAudioRepository sentenceTemplateAudioRepository;
    private final TtsService ttsService;
    private final SupabaseStorageService supabaseStorageService;

    public SampleAudioService(
            SentenceTemplateRepository sentenceTemplateRepository,
            SentenceTemplateAudioRepository sentenceTemplateAudioRepository,
            TtsService ttsService,
            SupabaseStorageService supabaseStorageService
    ) {
        this.sentenceTemplateRepository = sentenceTemplateRepository;
        this.sentenceTemplateAudioRepository = sentenceTemplateAudioRepository;
        this.ttsService = ttsService;
        this.supabaseStorageService = supabaseStorageService;
    }

    @Transactional
    public SampleAudioResponse generateOrGet(UUID sentenceTemplateId) {
        SentenceTemplate template = sentenceTemplateRepository.findById(sentenceTemplateId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Sentence template not found."
                ));

        SentenceTemplateAudio audio = sentenceTemplateAudioRepository
                .findBySentenceTemplateIdAndVoiceRole(sentenceTemplateId, PHASE1_VOICE_ROLE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Sentence template audio metadata not found."
                ));

        if (audio.getAudioPath() != null && !audio.getAudioPath().isBlank()) {
            return new SampleAudioResponse(
                    audio.getAudioPath(),
                    supabaseStorageService.buildPublicUrl(audio.getAudioPath()),
                    false
            );
        }

        byte[] mp3Bytes = ttsService.generate(
                template.getSampleAudioText(),
                audio.getVoiceId(),
                audio.getModelId()
        );

        String audioPath = buildAudioPath(sentenceTemplateId);

        supabaseStorageService.uploadMp3(audioPath, mp3Bytes);

        audio.setAudioPath(audioPath);
        sentenceTemplateAudioRepository.save(audio);

        return new SampleAudioResponse(
                audioPath,
                supabaseStorageService.buildPublicUrl(audioPath),
                true
        );
    }

    private String buildAudioPath(UUID sentenceTemplateId) {
        return "preset/" + sentenceTemplateId + "/" + PHASE1_VOICE_NAME + ".mp3";
    }
}
