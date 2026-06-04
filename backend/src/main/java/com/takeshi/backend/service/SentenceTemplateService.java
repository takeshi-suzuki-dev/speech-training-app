package com.takeshi.backend.service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.takeshi.backend.dto.request.SaveSentenceCategoryRequest;
import com.takeshi.backend.dto.request.SaveSentenceTemplateRequest;
import com.takeshi.backend.dto.response.SentenceCategoryResponse;
import com.takeshi.backend.dto.response.SentenceTemplateResponse;
import com.takeshi.backend.dto.response.TrainingAttemptResponse;
import com.takeshi.backend.entity.SentenceCategory;
import com.takeshi.backend.entity.SentenceTemplate;
import com.takeshi.backend.entity.SentenceTemplateAudio;
import com.takeshi.backend.repository.SentenceCategoryRepository;
import com.takeshi.backend.repository.SentenceTemplateAudioRepository;
import com.takeshi.backend.repository.SentenceTemplateRepository;
import com.takeshi.backend.repository.TemplateFavoriteRepository;
import com.takeshi.backend.repository.TrainingAttemptRepository;

@Service
public class SentenceTemplateService {
    private final SentenceCategoryRepository sentenceCategoryRepository;
    private final SentenceTemplateRepository sentenceTemplateRepository;
    private final TrainingAttemptRepository trainingAttemptRepository;
    private SentenceTemplateAudioRepository sentenceTemplateAudioRepository;
    private TemplateFavoriteRepository templateFavoriteRepository;
    private SupabaseStorageService supabaseStorageService;

    private static final String PHASE1_VOICE_ROLE = "male";

    @Value("${elevenlabs.voice-id}")
    private String defaultVoiceId;

    public SentenceTemplateService(
            SentenceCategoryRepository sentenceCategoryRepository,
            SentenceTemplateRepository sentenceTemplateRepository,
            TrainingAttemptRepository trainingAttemptRepository,
            SentenceTemplateAudioRepository sentenceTemplateAudioRepository,
            TemplateFavoriteRepository templateFavoriteRepository,
            SupabaseStorageService supabaseStorageService) {
        this.sentenceCategoryRepository = sentenceCategoryRepository;
        this.sentenceTemplateRepository = sentenceTemplateRepository;
        this.trainingAttemptRepository = trainingAttemptRepository;
        this.sentenceTemplateAudioRepository = sentenceTemplateAudioRepository;
        this.templateFavoriteRepository = templateFavoriteRepository;
        this.supabaseStorageService = supabaseStorageService;
    }

    @Transactional(readOnly = true)
    public List<SentenceCategoryResponse> findCategories(String firebaseUid) {
        return sentenceCategoryRepository.findVisibleCategories(firebaseUid)
                .stream()
                .map(SentenceCategoryResponse::from)
                .toList();
    }

    public List<SentenceTemplateResponse> findTemplatesByCategoryId(UUID categoryId) {
        return sentenceTemplateRepository.findByCategoryIdAndActiveTrueOrderBySortOrderAsc(categoryId)
                .stream()
                .map(SentenceTemplateResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SentenceTemplateResponse> findUserTemplatesByFirebaseUid(String firebaseUid) {
        return sentenceTemplateRepository
                .findByOwnerFirebaseUidAndActiveTrueOrderBySortOrderAsc(firebaseUid)
                .stream()
                .map(SentenceTemplateResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TrainingAttemptResponse> findLatestBySentenceForClient(UUID clientId) {
        return trainingAttemptRepository.findLatestBySentenceIdForClient(clientId)
                .stream()
                .map(TrainingAttemptResponse::from)
                .toList();
    }

    @Transactional
    public SentenceCategoryResponse createUserCategory(
            SaveSentenceCategoryRequest request,
            String firebaseUid) {

        String displayName = requireText(request.displayName(), "displayName");
        String description = blankToNull(request.description());

        Integer maxSortOrder = sentenceCategoryRepository
                .findMaxSortOrderForVisibleCategories(firebaseUid);

        SentenceCategory category = new SentenceCategory(
                displayName,
                description,
                firebaseUid,
                maxSortOrder + 1);

        SentenceCategory savedCategory = sentenceCategoryRepository.save(category);

        return SentenceCategoryResponse.from(savedCategory);
    }

    @Transactional
    public SentenceCategoryResponse updateUserCategory(
            UUID categoryId,
            SaveSentenceCategoryRequest request,
            String firebaseUid) {

        SentenceCategory category = sentenceCategoryRepository
                .findByIdAndOwnerFirebaseUidAndActiveTrue(categoryId, firebaseUid)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Category not found."));

        String displayName = requireText(request.displayName(), "displayName");
        String description = blankToNull(request.description());

        category.update(displayName, description);

        SentenceCategory savedCategory = sentenceCategoryRepository.save(category);

        return SentenceCategoryResponse.from(savedCategory);
    }

    @Transactional
    public void deleteUserCategory(UUID categoryId, String firebaseUid) {
        SentenceCategory category = sentenceCategoryRepository
                .findByIdAndOwnerFirebaseUidAndActiveTrue(categoryId, firebaseUid)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Category not found."));

        List<SentenceTemplate> templates = sentenceTemplateRepository
                .findByCategoryIdAndOwnerFirebaseUidAndActiveTrueOrderBySortOrderAsc(
                        categoryId,
                        firebaseUid);

        List<UUID> templateIds = templates.stream()
                .map(SentenceTemplate::getId)
                .toList();

        if (!templateIds.isEmpty()) {
            List<SentenceTemplateAudio> audios = sentenceTemplateAudioRepository
                    .findBySentenceTemplateIdIn(templateIds);

            for (SentenceTemplateAudio audio : audios) {
                supabaseStorageService.deleteMp3(audio.getAudioPath());
            }

            templateFavoriteRepository.deleteBySentenceTemplateIdIn(templateIds);
            sentenceTemplateAudioRepository.deleteBySentenceTemplateIdIn(templateIds);

            for (SentenceTemplate template : templates) {
                template.deactivate();
            }

            sentenceTemplateRepository.saveAll(templates);
        }

        category.deactivate();
        sentenceCategoryRepository.save(category);
    }

    @Transactional
    public SentenceTemplateResponse createUserTemplate(
            SaveSentenceTemplateRequest request,
            String firebaseUid) {

        validateCategoryExists(request.categoryId());

        String displayText = requireText(request.displayText(), "displayText");
        String scoringText = defaultIfBlank(request.scoringText(), displayText);
        String sampleAudioText = defaultIfBlank(request.sampleAudioText(), displayText);
        String title = defaultIfBlank(request.title(), buildDefaultTitle(displayText));
        String difficulty = defaultIfBlank(request.difficulty(), "easy");

        Integer maxSortOrder = sentenceTemplateRepository
                .findMaxSortOrderByCategoryIdAndOwnerFirebaseUid(
                        request.categoryId(),
                        firebaseUid);

        SentenceTemplate template = new SentenceTemplate(
                request.categoryId(),
                firebaseUid,
                title,
                displayText,
                scoringText,
                sampleAudioText,
                difficulty,
                maxSortOrder + 1);

        SentenceTemplate savedTemplate = sentenceTemplateRepository.save(template);

        sentenceTemplateAudioRepository.save(
                new SentenceTemplateAudio(
                        savedTemplate.getId(),
                        PHASE1_VOICE_ROLE,
                        defaultVoiceId,
                        null));

        return SentenceTemplateResponse.from(savedTemplate);
    }

    @Transactional
    public SentenceTemplateResponse updateUserTemplate(
            UUID templateId,
            SaveSentenceTemplateRequest request,
            String firebaseUid) {

        SentenceTemplate template = sentenceTemplateRepository
                .findByIdAndOwnerFirebaseUidAndActiveTrue(templateId, firebaseUid)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Sentence template not found."));

        validateCategoryExists(request.categoryId());

        String displayText = requireText(request.displayText(), "displayText");
        String scoringText = defaultIfBlank(request.scoringText(), displayText);
        String sampleAudioText = defaultIfBlank(request.sampleAudioText(), displayText);
        String title = defaultIfBlank(request.title(), buildDefaultTitle(displayText));
        String difficulty = defaultIfBlank(request.difficulty(), "easy");

        boolean shouldResetSampleAudio = !Objects.equals(template.getSampleAudioText(), sampleAudioText);

        template.update(
                request.categoryId(),
                title,
                displayText,
                scoringText,
                sampleAudioText,
                difficulty);

        SentenceTemplate savedTemplate = sentenceTemplateRepository.save(template);

        if (shouldResetSampleAudio) {
            resetSampleAudioFiles(templateId);
        }

        return SentenceTemplateResponse.from(savedTemplate);
    }

    @Transactional
    public void deleteUserTemplate(UUID templateId, String firebaseUid) {
        SentenceTemplate template = sentenceTemplateRepository
                .findByIdAndOwnerFirebaseUidAndActiveTrue(templateId, firebaseUid)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Sentence template not found."));

        List<UUID> templateIds = List.of(templateId);

        List<SentenceTemplateAudio> audios = sentenceTemplateAudioRepository.findBySentenceTemplateIdIn(templateIds);

        for (SentenceTemplateAudio audio : audios) {
            supabaseStorageService.deleteMp3(audio.getAudioPath());
        }

        templateFavoriteRepository.deleteBySentenceTemplateIdIn(templateIds);
        sentenceTemplateAudioRepository.deleteBySentenceTemplateIdIn(templateIds);

        template.deactivate();
        sentenceTemplateRepository.save(template);
    }

    private void resetSampleAudioFiles(UUID templateId) {
        List<SentenceTemplateAudio> audios = sentenceTemplateAudioRepository
                .findBySentenceTemplateIdIn(List.of(templateId));

        for (SentenceTemplateAudio audio : audios) {
            supabaseStorageService.deleteMp3(audio.getAudioPath());
            audio.setAudioPath(null);
        }

        sentenceTemplateAudioRepository.saveAll(audios);
    }

    private void validateCategoryExists(UUID categoryId) {
        if (categoryId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category is required.");
        }

        SentenceCategory category = sentenceCategoryRepository.findById(categoryId)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Category not found."));

        if (!Boolean.TRUE.equals(category.getActive())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Category not found.");
        }
    }

    private String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " is required.");
        }

        return value.trim();
    }

    private String defaultIfBlank(String value, String defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }

        return value.trim();
    }

    private String buildDefaultTitle(String displayText) {
        if (displayText.length() <= 40) {
            return displayText;
        }

        return displayText.substring(0, 40);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
