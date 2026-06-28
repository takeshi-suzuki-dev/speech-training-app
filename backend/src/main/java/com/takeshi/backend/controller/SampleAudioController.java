package com.takeshi.backend.controller;

import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.takeshi.backend.auth.FirebaseAuthenticationInterceptor;
import com.takeshi.backend.service.SampleAudioService;

@RestController
@RequestMapping("/api/sentence-templates")
public class SampleAudioController {

    private final SampleAudioService sampleAudioService;

    public SampleAudioController(SampleAudioService sampleAudioService) {
        this.sampleAudioService = sampleAudioService;
    }

    @PostMapping("/{templateId}/sample-audio")
    public ResponseEntity<byte[]> generateSampleAudio(
            @PathVariable UUID templateId,
            @RequestAttribute(FirebaseAuthenticationInterceptor.FIREBASE_UID_ATTRIBUTE) String firebaseUid) {
        byte[] mp3Bytes = sampleAudioService.generateOrGetAudio(templateId, firebaseUid);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(mp3Bytes);
    }
}
