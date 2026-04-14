package com.takeshi.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takeshi.backend.dto.response.SentenceScores;
import com.takeshi.backend.dto.response.SpeechEvaluateResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class PronunciationService {

    @Value("${azure.speech.key}")
    private String speechKey;
    @Value("${azure.speech.region}")
    private String speechRegion;

    public SpeechEvaluateResponse score(MultipartFile audio, String referenceText) {
        if (audio == null || audio.isEmpty()) {
            throw new IllegalArgumentException("audio file is required");
        }
        if (referenceText == null || referenceText.isEmpty()) {
            throw new IllegalArgumentException("referenceText file is required");
        }

        return callAzureAndMapResponse(audio, referenceText);
    }

    private SpeechEvaluateResponse callAzureAndMapResponse(MultipartFile audio, String referenceText) {

        try {
            String paJson = buildPronunciationAssessmentJson(referenceText);
            String paBase64 = Base64.getEncoder().encodeToString(
                    paJson.getBytes(StandardCharsets.UTF_8)
            );

            String url = "https://" + speechRegion + ".stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Ocp-Apim-Subscription-Key", speechKey)
                    .header("Content-Type", "audio/wav")
                    .header("Pronunciation-Assessment", paBase64)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(audio.getBytes()))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("Azure Speech API error: " + response.statusCode() + "body: " + response.body());
            }

            return mapAzureResponse(response.body(), referenceText);

        } catch (Exception e) {
            throw new RuntimeException("Failed to call Azure Speech API: ", e);
        }

//        SpeechEvaluateResponse response = new SpeechEvaluateResponse();
//        SentenceScores sentenceScores = new SentenceScores();
//        sentenceScores.setAccuracy(80);
//        sentenceScores.setFluency(72);
//        sentenceScores.setCompleteness(90);
//        sentenceScores.setProsody(68);
//
//        WordResult wordResult = new WordResult();
//        wordResult.setWord("want");
//        wordResult.setScores(Map.of("accuracy", 82));
//        wordResult.setErrorType("MisPronunciation");
//        wordResult.setOffset(1200000L);
//        wordResult.setDuration(350000L);
//
//        PhonemeResult phonemeResult = new PhonemeResult();
//        phonemeResult.setWord("Want");
//        phonemeResult.setPhoneme("ɑː");
//        phonemeResult.setScores(Map.of("accuracy", 70));
//        phonemeResult.setExpectedIpa("ɑː");
//        phonemeResult.setCandidates(List.of("ɑː", "ʌ"));
//        phonemeResult.setOffset(1450000L);
//        phonemeResult.setDuration(120000L);
//
//        response.setTranscript("I want to improve my English speaking.");
//        response.setOverallScore(78);
//        response.setSentenceScores(sentenceScores);
//        response.setWords(List.of(wordResult));
//        response.setPhonemes(List.of(phonemeResult));
//        response.setExtras(Map.of("someUnmappedField", "example"));
//        response.setRawJson(Map.of());
//
//        return response;
    }

    private String buildPronunciationAssessmentJson(String referenceText) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        Map<String, Object> pa = new LinkedHashMap<>();
        pa.put("ReferenceText", referenceText);
        pa.put("GradingSystem", "HundredMark");
        pa.put("Granularity", "Phoneme");
        pa.put("Dimension", "Comprehensive");
        pa.put("EnableMiscue", true);
        pa.put("phonemeAlphabet", "IPA");
        pa.put("NBestPhonemeCount", 5);
        pa.put("EnableProsodyAssessment", true);

        return objectMapper.writeValueAsString(pa);
    }

    private SpeechEvaluateResponse mapAzureResponse(String responseBody, String referencetext) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode root = objectMapper.readTree(responseBody);

        SpeechEvaluateResponse response = new SpeechEvaluateResponse();
        response.setRawJson(responseBody);
        System.out.println(responseBody);

        JsonNode nbest0 = root.path("NBest").isArray() && root.path("NBest").size() > 0 ? root.path("NBest").get(0) : null;

        if (nbest0 != null) {
            response.setTranscript(nbest0.path("Display").asText(""));

            SentenceScores sentenceScores = new SentenceScores();
            sentenceScores.setAccuracy((int) Math.round(nbest0.path("AccuracyScore").asDouble(0)));
            sentenceScores.setFluency((int) Math.round(nbest0.path("FluencyScore").asDouble(0)));
            sentenceScores.setCompleteness((int) Math.round(nbest0.path("CompletenessScore").asDouble(0)));
            sentenceScores.setProsody((int) Math.round(nbest0.path("ProsodyScore").asDouble(0)));
            sentenceScores.setPron((int) Math.round(nbest0.path("PronScore").asDouble(0)));
            response.setSentenceScores(sentenceScores);
        }

        return response;
    }
}
