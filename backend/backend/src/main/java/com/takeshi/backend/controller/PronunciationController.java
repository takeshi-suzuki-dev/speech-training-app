package com.takeshi.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takeshi.backend.dto.request.CreateTrainingAttemptRequest;
import com.takeshi.backend.dto.response.SentenceScores;
import com.takeshi.backend.dto.response.SpeechEvaluateResponse;
import com.takeshi.backend.service.PronunciationService;
import com.takeshi.backend.service.TrainingAttemptService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/pronunciation")
@CrossOrigin(origins = "http://localhost:3000")
public class PronunciationController {

    private final PronunciationService pronunciationService;
    private final TrainingAttemptService trainingAttemptService;
    private final ObjectMapper objectMapper;
    private static final Logger logger = LoggerFactory.getLogger(PronunciationController.class);

    public PronunciationController(
            PronunciationService pronunciationService,
            TrainingAttemptService trainingAttemptService,
            ObjectMapper objectMapper
    ) {
        this.pronunciationService = pronunciationService;
        this.trainingAttemptService = trainingAttemptService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/score", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SpeechEvaluateResponse> score(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("referenceText") String referenceText,
            @RequestParam("clientId") UUID clientId,
            @RequestParam(value = "mode", defaultValue = "sentence") String mode,
            @RequestParam(value = "sentenceId", required = false) UUID sentenceId
    ) {

        SpeechEvaluateResponse result = pronunciationService.score(audio, referenceText);
        SentenceScores scores = result.getSentenceScores();

        try {
            trainingAttemptService.create(
                    new CreateTrainingAttemptRequest(
                            clientId,
                            null,
                            mode,
                            sentenceId,
                            referenceText,
                            result.getTranscript(),
                            scores != null ? toBigDecimal(scores.getPron()) : null,
                            scores != null ? toBigDecimal(scores.getAccuracy()) : null,
                            scores != null ? toBigDecimal(scores.getFluency()) : null,
                            scores != null ? toBigDecimal(scores.getCompleteness()) : null,
                            scores != null ? toBigDecimal(scores.getProsody()) : null,
                            toJsonOrNull(result.getWords()),
                            null
                    )
            );
        } catch (Exception e) {
            logger.error("Failed to save training attempt.", e);
        }

        return ResponseEntity.ok(result);
    }

    private BigDecimal toBigDecimal(Number value) {
        if (value == null) {
            return null;
        }

        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }

        return BigDecimal.valueOf(value.doubleValue());
    }

    private String toJsonOrNull(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize words to JSON.", e);
            return null;
        }
    }
}
