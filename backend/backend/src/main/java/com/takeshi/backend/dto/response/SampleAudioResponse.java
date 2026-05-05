package com.takeshi.backend.dto.response;

public record SampleAudioResponse(
        String audioPath,
        String audioUrl,
        boolean generated) {
}
