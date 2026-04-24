package com.takeshi.backend.dto.response;

import java.util.List;

public class SpeechEvaluateResponse {
    private String transcript;
    private String recognitionStatus;
    private SentenceScores sentenceScores;
    private List<WordResult> words;
    private List<PhonemeResult> phonemes;
    private Object rawJson;

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getRecognitionStatus() {
        return recognitionStatus;
    }

    public void setRecognitionStatus(String recognitionStatus) {
        this.recognitionStatus = recognitionStatus;
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

    public Object getRawJson() {
        return rawJson;
    }

    public void setRawJson(Object rawJson) {
        this.rawJson = rawJson;
    }
}
