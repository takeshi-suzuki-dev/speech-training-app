package com.takeshi.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class TtsService {
    @Value("${elevenlabs.api-key}")
    private String apiKey;
    @Value("${elevenlabs.voice-id}")
    private String voiceId;

    private final RestTemplate restTemplete = new RestTemplate();

    public byte[] generate(String text) {
        String url = "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("xi-api-key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "text", text,
                "model_id", "eleven_multilingual_v2",
                "voice_settings", Map.of("speed", 0.9)
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<byte[]> response = restTemplete.exchange(
                url,
                HttpMethod.POST,
                request,
                byte[].class
        );

        return response.getBody();
    }
}
