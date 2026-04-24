package com.takeshi.backend.controller;

import com.takeshi.backend.dto.request.TtsRequest;
import com.takeshi.backend.service.TtsService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TtsController {

    private final TtsService ttsService;

    public TtsController(TtsService ttsService) {
        this.ttsService = ttsService;
    }

    @PostMapping(value = "tts", produces = "audio/mpeg")
    public ResponseEntity<byte[]> getTts(@RequestBody TtsRequest request) {
        byte[] audio = ttsService.generate(request.getText());
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("audio/mpeg"))
                .body(audio);
    }
}
