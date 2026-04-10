package com.takeshi.backend.service;

import com.takeshi.backend.dto.response.PhonemeResult;
import com.takeshi.backend.dto.response.SentenceScores;
import com.takeshi.backend.dto.response.SpeechEvaluateResponse;
import com.takeshi.backend.dto.response.WordResult;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
public class PronunciationService {
    public SpeechEvaluateResponse score(MultipartFile audio, String referenceText) {
        SpeechEvaluateResponse response = new SpeechEvaluateResponse();
        SentenceScores sentenceScores = new SentenceScores();
        sentenceScores.setAccuracy(80);
        sentenceScores.setFluency(72);
        sentenceScores.setCompleteness(90);
        sentenceScores.setProsody(68);

        WordResult wordResult = new WordResult();
        wordResult.setWord("want");
        wordResult.setScores(Map.of("accuracy", 82));
        wordResult.setErrorType("MisPronunciation");
        wordResult.setOffset(1200000L);
        wordResult.setDuration(350000L);

        PhonemeResult phonemeResult = new PhonemeResult();
        phonemeResult.setWord("Want");
        phonemeResult.setPhoneme("ɑː");
        phonemeResult.setScores(Map.of("accuracy", 70));
        phonemeResult.setExpectedIpa("ɑː");
        phonemeResult.setCandidates(List.of("ɑː", "ʌ"));
        phonemeResult.setOffset(1450000L);
        phonemeResult.setDuration(120000L);

        response.setTranscript("I want to improve my English speaking.");
        response.setOverallScore(78);
        response.setSentenceScores(sentenceScores);
        response.setWords(List.of(wordResult));
        response.setPhonemes(List.of(phonemeResult));
        response.setExtras(Map.of("someUnmappedField", "example"));
        response.setRawJson(Map.of());

        return response;
    }
}
