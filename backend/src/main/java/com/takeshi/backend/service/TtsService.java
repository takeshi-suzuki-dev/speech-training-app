package com.takeshi.backend.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.takeshi.backend.exception.ElevenLabsApiException;

@Service
public class TtsService {

    private static final String DEFAULT_MODEL_ID = "eleven_multilingual_v2";

    @Value("${elevenlabs.api-key}")
    private String apiKey;
    @Value("${elevenlabs.voice-id}")
    private String voiceId;

    private final RestTemplate restTemplate = new RestTemplate();

    public byte[] generate(String text, String voiceId, String modelId) {
        String url = "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("xi-api-key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "text",
                text,
                "model_id",
                modelId != null ? modelId : DEFAULT_MODEL_ID,
                "voice_settings",
                Map.of("speed", 0.9));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    byte[].class);

            return response.getBody();
        } catch (HttpStatusCodeException e) {
            throw new ElevenLabsApiException(e.getStatusCode().value());
        }
    }
}
