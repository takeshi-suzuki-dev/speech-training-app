package com.takeshi.backend.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.takeshi.backend.dto.response.SampleAudioResponse;
import com.takeshi.backend.service.SampleAudioService;

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
            @PathVariable UUID templateId) {
        return sampleAudioService.generateOrGet(templateId);
    }
}