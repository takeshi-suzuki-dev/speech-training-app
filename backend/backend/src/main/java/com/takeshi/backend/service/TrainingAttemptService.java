package com.takeshi.backend.service;

import com.takeshi.backend.dto.request.CreateTrainingAttemptRequest;
import com.takeshi.backend.dto.response.TrainingAttemptResponse;
import com.takeshi.backend.entity.TrainingAttempt;
import com.takeshi.backend.repository.TrainingAttemptRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TrainingAttemptService {

    private final TrainingAttemptRepository trainingAttemptRepository;

    public TrainingAttemptService(TrainingAttemptRepository trainingAttemptRepository) {
        this.trainingAttemptRepository = trainingAttemptRepository;
    }

    @Transactional
    public TrainingAttemptResponse create(CreateTrainingAttemptRequest request) {
        validateCreateRequest(request);

        TrainingAttempt attempt = new TrainingAttempt(
                request.clientId(),
                request.userId(),
                request.mode(),
                request.sentenceId(),
                request.referenceText(),
                request.recognizedText(),
                request.overallScore(),
                request.accuracyScore(),
                request.fluencyScore(),
                request.completenessScore(),
                request.prosodyScore(),
                request.wordsJson(),
                request.audioDurationMs()
        );

        TrainingAttempt saved = trainingAttemptRepository.save(attempt);
        return TrainingAttemptResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<TrainingAttemptResponse> findRecentByClientId(UUID clientId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);

        return trainingAttemptRepository
                .findByClientIdOrderByCreatedAtDesc(clientId, PageRequest.of(0, safeLimit))
                .stream()
                .map(TrainingAttemptResponse::from)
                .toList();
    }

    private void validateCreateRequest(CreateTrainingAttemptRequest request) {
        if (request.clientId() == null) {
            throw new IllegalArgumentException("clientId is required.");
        }

        if (request.mode() == null || request.mode().isBlank()) {
            throw new IllegalArgumentException("mode is required.");
        }

        if (!request.mode().equals("sentence") && !request.mode().equals("free")) {
            throw new IllegalArgumentException("mode must be 'sentence' or 'free'.");
        }

        if (request.referenceText() == null || request.referenceText().isBlank()) {
            throw new IllegalArgumentException("referenceText is required.");
        }
    }
}
