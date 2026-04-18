package com.takeshi.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takeshi.backend.dto.response.PhonemeResult;
import com.takeshi.backend.dto.response.SentenceScores;
import com.takeshi.backend.dto.response.SpeechEvaluateResponse;
import com.takeshi.backend.dto.response.WordResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class PronunciationService {

    private static final String N_BEST = "NBest";
    private static final String WORDS = "Words";
    private static final String PHONEMES = "Phonemes";
    private static final String N_BEST_PHONEMES = "NBestPhonemes";

    private static final String WORD = "Word";
    private static final String PHONEME = "Phoneme";
    private static final String DISPLAY = "Display";
    private static final String ERROR_TYPE = "ErrorType";
    private static final String OFFSET = "Offset";
    private static final String DURATION = "Duration";
    private static final String SCORE = "Score";

    private static final String ACCURACY_SCORE = "AccuracyScore";
    private static final String FLUENCY_SCORE = "FluencyScore";
    private static final String COMPLETENESS_SCORE = "CompletenessScore";
    private static final String PROSODY_SCORE = "ProsodyScore";
    private static final String PRON_SCORE = "PronScore";

    private static final String WORD_ACCURACY_SCORE_KEY = "accuracyScore";
    private static final String CANDIDATE_1_SCORE_KEY = "candidate1Score";
    private static final String CANDIDATE_2_SCORE_KEY = "candidate2Score";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

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
            var paJson = buildPronunciationAssessmentJson(referenceText);
            var paBase64 = Base64.getEncoder().encodeToString(
                    paJson.getBytes(StandardCharsets.UTF_8)
            );

            var url = "https://" + speechRegion
                    + ".stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1"
                    + "?language=en-US&format=detailed";

            var request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Ocp-Apim-Subscription-Key", speechKey)
                    .header("Content-Type", "audio/wav")
                    .header("Pronunciation-Assessment", paBase64)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(audio.getBytes()))
                    .build();

            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("Azure Speech API error: " + response.statusCode() + "body: " + response.body());
            }

            return mapAzureResponse(response.body());
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Azure Speech API: ", e);
        }
    }

    private String buildPronunciationAssessmentJson(String referenceText) throws JsonProcessingException {
        var pa = new LinkedHashMap<String, Object>();
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

    private SpeechEvaluateResponse mapAzureResponse(String responseBody) throws JsonProcessingException {
        var root = objectMapper.readTree(responseBody);

        var response = new SpeechEvaluateResponse();
        response.setRawJson(objectMapper.convertValue(root, Object.class));
        System.out.println(responseBody);

        var nbest0 = getFirstNBest(root);
        if (nbest0 == null) {
            return response;
        }

        response.setTranscript(nbest0.path(DISPLAY).asText(""));
        response.setSentenceScores(mapSentenceScores(nbest0));
        response.setWords(mapWords(nbest0));
        response.setPhonemes(mapPhonemes(nbest0));

        return response;
    }

    private JsonNode getFirstNBest(JsonNode root) {
        var nBestNodes = root.path(N_BEST);
        if (!nBestNodes.isArray() || nBestNodes.isEmpty()) {
            return null;
        }
        return nBestNodes.get(0);
    }

    private SentenceScores mapSentenceScores(JsonNode nbest0) {
        var sentenceScores = new SentenceScores();
        sentenceScores.setAccuracy((int) Math.round(nbest0.path(ACCURACY_SCORE).asDouble(0)));
        sentenceScores.setFluency((int) Math.round(nbest0.path(FLUENCY_SCORE).asDouble(0)));
        sentenceScores.setCompleteness((int) Math.round(nbest0.path(COMPLETENESS_SCORE).asDouble(0)));
        sentenceScores.setProsody((int) Math.round(nbest0.path(PROSODY_SCORE).asDouble(0)));
        sentenceScores.setPron((int) Math.round(nbest0.path(PRON_SCORE).asDouble(0)));
        return sentenceScores;
    }

    private List<WordResult> mapWords(JsonNode nbest0) {
        var words = new ArrayList<WordResult>();
        var wordNodes = nbest0.path(WORDS);

        if (!wordNodes.isArray()) {
            return words;
        }

        for (var wordNode : wordNodes) {
            var wordResult = new WordResult();
            wordResult.setWord(wordNode.path(WORD).asText(""));
            wordResult.setErrorType(wordNode.path(ERROR_TYPE).asText(""));
            wordResult.setOffset(longOrNull(wordNode.get(OFFSET)));
            wordResult.setDuration(longOrNull(wordNode.get(DURATION)));

            var wordScores = new LinkedHashMap<String, Object>();
            putIfPresent(wordScores, WORD_ACCURACY_SCORE_KEY, doubleOrNull(wordNode.get(ACCURACY_SCORE)));
            wordResult.setScores(wordScores);

            words.add(wordResult);
        }

        return words;
    }

    private List<PhonemeResult> mapPhonemes(JsonNode nbest0) {
        var phonemes = new ArrayList<PhonemeResult>();
        var wordNodes = nbest0.path(WORDS);

        if (!wordNodes.isArray()) {
            return phonemes;
        }

        for (var wordNode : wordNodes) {
            var phonemeNodes = wordNode.path(PHONEMES);
            if (!phonemeNodes.isArray()) {
                continue;
            }

            var word = wordNode.path(WORD).asText("");
            for (var phonemeNode : phonemeNodes) {
                var phonemeResult = new PhonemeResult();
                var phoneme = phonemeNode.path(PHONEME).asText("");

                phonemeResult.setWord(word);
                phonemeResult.setPhoneme(phoneme);
                phonemeResult.setExpectedIpa(phoneme);
                phonemeResult.setOffset(longOrNull(phonemeNode.get(OFFSET)));
                phonemeResult.setDuration(longOrNull(phonemeNode.get(DURATION)));

                var phonemeScores = new LinkedHashMap<String, Object>();
                putIfPresent(phonemeScores, WORD_ACCURACY_SCORE_KEY, doubleOrNull(phonemeNode.get(ACCURACY_SCORE)));

                var candidates = new ArrayList<String>();
                var nBestPhonemes = phonemeNode.path(N_BEST_PHONEMES);
                if (nBestPhonemes.isArray()) {
                    for (int i = 0; i < Math.min(nBestPhonemes.size(), 2); i++) {
                        var candidateNode = nBestPhonemes.get(i);

                        var candidatePhoneme = candidateNode.path(PHONEME).asText("");
                        if (!candidatePhoneme.isBlank()) {
                            candidates.add(candidatePhoneme);
                        }

                        if (i == 0) {
                            putIfPresent(phonemeScores, CANDIDATE_1_SCORE_KEY, doubleOrNull(candidateNode.get(SCORE)));
                        } else if (i == 1) {
                            putIfPresent(phonemeScores, CANDIDATE_2_SCORE_KEY, doubleOrNull(candidateNode.get(SCORE)));
                        }
                    }
                }

                phonemeResult.setCandidates(candidates);
                phonemeResult.setScores(phonemeScores);

                phonemes.add(phonemeResult);
            }
        }

        return phonemes;
    }

    private void putIfPresent(Map<String, Object> target, String key, Object value) {
        if (value != null) {
            target.put(key, value);
        }
    }

    private Double doubleOrNull(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            return null;
        }
        return node.asDouble();
    }

    private Long longOrNull(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            return null;
        }
        return node.asLong();
    }
}
