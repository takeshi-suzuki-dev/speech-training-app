package com.takeshi.backend.dto.response;

import java.util.Map;

public class WordResult {
    private String word;
    private Map<String, Object> scores;
    private String errorType;
    private Long offset;
    private Long duration;

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public Map<String, Object> getScores() {
        return scores;
    }

    public void setScores(Map<String, Object> scores) {
        this.scores = scores;
    }

    public String getErrorType() {
        return errorType;
    }

    public void setErrorType(String errorType) {
        this.errorType = errorType;
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
