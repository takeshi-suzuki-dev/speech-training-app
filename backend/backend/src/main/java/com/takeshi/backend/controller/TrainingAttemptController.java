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

import com.takeshi.backend.dto.request.CreateTrainingAttemptRequest;
import com.takeshi.backend.dto.response.TrainingAttemptResponse;
import com.takeshi.backend.service.TrainingAttemptService;

@RestController
@RequestMapping("/api/training-attempts")
public class TrainingAttemptController {

    private final TrainingAttemptService trainingAttemptService;

    public TrainingAttemptController(TrainingAttemptService trainingAttemptService) {
        this.trainingAttemptService = trainingAttemptService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingAttemptResponse create(@RequestBody CreateTrainingAttemptRequest request) {
        return trainingAttemptService.create(request);
    }

    @GetMapping
    public List<TrainingAttemptResponse> findRecentByClientId(
            @RequestParam UUID clientId,
            @RequestParam(defaultValue = "20") int limit) {
        return trainingAttemptService.findRecentByClientId(clientId, limit);
    }
}
