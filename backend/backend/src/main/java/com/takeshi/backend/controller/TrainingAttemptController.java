package com.takeshi.backend.controller;

import com.takeshi.backend.dto.request.CreateTrainingAttemptRequest;
import com.takeshi.backend.dto.response.TrainingAttemptResponse;
import com.takeshi.backend.service.TrainingAttemptService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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
            @RequestParam(defaultValue = "20") int limit
    ) {
        return trainingAttemptService.findRecentByClientId(clientId, limit);
    }
}
