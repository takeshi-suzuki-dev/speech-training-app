package com.takeshi.backend.service;

import java.util.Objects;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.takeshi.backend.entity.SentenceTemplate;
import com.takeshi.backend.entity.SentenceTemplateAudio;
import com.takeshi.backend.repository.SentenceTemplateAudioRepository;
import com.takeshi.backend.repository.SentenceTemplateRepository;

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
            SupabaseStorageService supabaseStorageService) {
        this.sentenceTemplateRepository = sentenceTemplateRepository;
        this.sentenceTemplateAudioRepository = sentenceTemplateAudioRepository;
        this.ttsService = ttsService;
        this.supabaseStorageService = supabaseStorageService;
    }

    @Transactional
    public byte[] generateOrGetAudio(
            UUID sentenceTemplateId,
            String firebaseUid) {
        SentenceTemplate template = sentenceTemplateRepository.findById(sentenceTemplateId)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Sentence template not found."));

        requireSampleAudioAccess(template, firebaseUid);

        SentenceTemplateAudio audio = sentenceTemplateAudioRepository
                .findBySentenceTemplateIdAndVoiceRole(sentenceTemplateId, PHASE1_VOICE_ROLE)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Sentence template audio metadata not found."));

        if (audio.getAudioPath() != null && !audio.getAudioPath().isBlank()) {
            return supabaseStorageService.downloadMp3(audio.getAudioPath());
        }

        byte[] mp3Bytes = ttsService.generate(
                template.getSampleAudioText(),
                audio.getVoiceId(),
                audio.getModelId());

        String audioPath = buildAudioPath(template, sentenceTemplateId);
        supabaseStorageService.uploadMp3(audioPath, mp3Bytes);

        audio.setAudioPath(audioPath);
        sentenceTemplateAudioRepository.save(audio);

        return mp3Bytes;
    }

    private void requireSampleAudioAccess(
            SentenceTemplate template,
            String firebaseUid) {
        if (!Boolean.TRUE.equals(template.getActive())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Sentence template not found.");
        }

        String ownerFirebaseUid = template.getOwnerFirebaseUid();

        if (ownerFirebaseUid == null || ownerFirebaseUid.isBlank()) {
            return;
        }

        if (!Objects.equals(ownerFirebaseUid, firebaseUid)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Sentence template not found.");
        }
    }

    private String buildAudioPath(
            SentenceTemplate template,
            UUID sentenceTemplateId) {
        String ownerFirebaseUid = template.getOwnerFirebaseUid();

        if (ownerFirebaseUid == null || ownerFirebaseUid.isBlank()) {
            return "preset/" + sentenceTemplateId + "/" + PHASE1_VOICE_NAME + ".mp3";
        }

        return "users/"
                + ownerFirebaseUid
                + "/templates/"
                + sentenceTemplateId
                + "/"
                + PHASE1_VOICE_NAME
                + ".mp3";
    }
}
