package com.takeshi.backend.controller;

import com.takeshi.backend.dto.response.SampleAudioResponse;
import com.takeshi.backend.service.SampleAudioService;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sentence-templates")
@CrossOrigin(origins = "http://localhost:3000")
public class SampleAudioController {

    private final SampleAudioService sampleAudioService;

    public SampleAudioController(SampleAudioService sampleAudioService) {
        this.sampleAudioService = sampleAudioService;
    }

    @PostMapping("/{templateId}/sample-audio")
    public SampleAudioResponse generateSampleAudio(
            @PathVariable UUID templateId
    ) {
        return sampleAudioService.generateOrGet(templateId);
    }
}