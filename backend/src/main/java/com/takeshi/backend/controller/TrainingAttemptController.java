package com.takeshi.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.takeshi.backend.auth.ClientIdentity;
import com.takeshi.backend.dto.request.CreateTrainingAttemptRequest;
import com.takeshi.backend.dto.response.DailyScoreTrendResponse;
import com.takeshi.backend.dto.response.TrainingAttemptResponse;
import com.takeshi.backend.service.TrainingAttemptService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/training-attempts")
public class TrainingAttemptController {

    private final TrainingAttemptService trainingAttemptService;

    public TrainingAttemptController(TrainingAttemptService trainingAttemptService) {
        this.trainingAttemptService = trainingAttemptService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingAttemptResponse create(
            @RequestBody CreateTrainingAttemptRequest request,
            HttpServletRequest httpRequest) {

        UUID clientId = ClientIdentity.resolve(httpRequest);

        return trainingAttemptService.create(withClientId(request, clientId));
    }

    @GetMapping
    public List<TrainingAttemptResponse> findRecentByClientId(
            @RequestParam(defaultValue = "20") int limit,
            HttpServletRequest httpRequest) {

        return trainingAttemptService.findRecentByClientId(
                ClientIdentity.resolve(httpRequest), limit);
    }

    @GetMapping("/history-trends")
    public List<DailyScoreTrendResponse> findDailyScoreTrends(HttpServletRequest httpRequest) {
        return trainingAttemptService.findDailyScoreTrends(
                ClientIdentity.resolve(httpRequest));
    }

    private CreateTrainingAttemptRequest withClientId(
            CreateTrainingAttemptRequest request, UUID clientId) {

        return new CreateTrainingAttemptRequest(
                clientId,
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
                request.audioDurationMs());
    }
}
