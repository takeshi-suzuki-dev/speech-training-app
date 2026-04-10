package com.takeshi.backend.dto.response;

import java.util.List;
import java.util.Map;

public class SpeechEvaluateResponse {
    private String transcript;
    private Integer overallScore;
    private SentenceScores sentenceScores;
    private List<WordResult> words;
    private List<PhonemeResult> phonemes;
    private Map<String, Object> extras;
    private Object rawJson;

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public SentenceScores getSentenceScores() {
        return sentenceScores;
    }

    public void setSentenceScores(SentenceScores sentenceScores) {
        this.sentenceScores = sentenceScores;
    }

    public List<WordResult> getWords() {
        return words;
    }

    public void setWords(List<WordResult> words) {
        this.words = words;
    }

    public List<PhonemeResult> getPhonemes() {
        return phonemes;
    }

    public void setPhonemes(List<PhonemeResult> phonemes) {
        this.phonemes = phonemes;
    }

    public Map<String, Object> getExtras() {
        return extras;
    }

    public void setExtras(Map<String, Object> extras) {
        this.extras = extras;
    }

    public Object getRawJson() {
        return rawJson;
    }

    public void setRawJson(Object rawJson) {
        this.rawJson = rawJson;
    }
}
