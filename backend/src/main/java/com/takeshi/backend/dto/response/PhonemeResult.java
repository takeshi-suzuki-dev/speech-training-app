package com.takeshi.backend.dto.response;

import java.util.List;
import java.util.Map;

public class PhonemeResult {
    private String word;
    private String phoneme;
    private Map<String, Object> scores;
    private String expectedIpa;
    private List<String> candidates;
    private Long offset;
    private Long duration;

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getPhoneme() {
        return phoneme;
    }

    public void setPhoneme(String phoneme) {
        this.phoneme = phoneme;
    }

    public Map<String, Object> getScores() {
        return scores;
    }

    public void setScores(Map<String, Object> scores) {
        this.scores = scores;
    }

    public String getExpectedIpa() {
        return expectedIpa;
    }

    public void setExpectedIpa(String expectedIpa) {
        this.expectedIpa = expectedIpa;
    }

    public List<String> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<String> candidates) {
        this.candidates = candidates;
    }

    public Long getOffset() {
        return offset;
    }

    public void setOffset(Long offset) {
        this.offset = offset;
    }

    public Long getDuration() {
        return duration;
    }

    public void setDuration(Long duration) {
        this.duration = duration;
    }
}
