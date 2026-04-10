package com.takeshi.backend.dto.response;

import java.util.Map;

public class SentenceScores {
    private Integer accuracy;
    private Integer fluency;
    private Integer completeness;
    private Integer prosody;
    private Map<String, Object> additionalScores;

    public Integer getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Integer accuracy) {
        this.accuracy = accuracy;
    }

    public Integer getFluency() {
        return fluency;
    }

    public void setFluency(Integer fluency) {
        this.fluency = fluency;
    }

    public Integer getCompleteness() {
        return completeness;
    }

    public void setCompleteness(Integer completeness) {
        this.completeness = completeness;
    }

    public Integer getProsody() {
        return prosody;
    }

    public void setProsody(Integer prosody) {
        this.prosody = prosody;
    }

    public Map<String, Object> getAdditionalScores() {
        return additionalScores;
    }

    public void setAdditionalScores(Map<String, Object> additionalScores) {
        this.additionalScores = additionalScores;
    }
}
