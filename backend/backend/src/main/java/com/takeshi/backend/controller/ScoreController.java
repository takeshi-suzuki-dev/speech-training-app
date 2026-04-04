package com.takeshi.backend.controller;

import com.takeshi.backend.dto.request.ScoreRequest;
import com.takeshi.backend.dto.response.ScoreResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ScoreController {
    @PostMapping("/score")
    public ScoreResponse score(@RequestBody ScoreRequest request) {
        return new ScoreResponse(request.text());
    }
}
