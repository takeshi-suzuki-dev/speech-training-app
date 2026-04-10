package com.takeshi.backend.controller;

import com.takeshi.backend.dto.response.SpeechEvaluateResponse;
import com.takeshi.backend.service.PronunciationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pronunciation")
@CrossOrigin(origins = "http://localhost:3000")
public class PronunciationController {
    private final PronunciationService pronunciationService;

    public PronunciationController(PronunciationService pronunciationService) {
        this.pronunciationService = pronunciationService;
    }

    @PostMapping(value = "/score", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SpeechEvaluateResponse> score(
            @RequestPart("audio") MultipartFile audio,
            @RequestPart("referenceText") String referenceText
    ) {
        SpeechEvaluateResponse response = pronunciationService.score(audio, referenceText);
        return ResponseEntity.ok(response);
    }
}
