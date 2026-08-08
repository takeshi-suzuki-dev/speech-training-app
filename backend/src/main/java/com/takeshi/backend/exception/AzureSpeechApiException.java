package com.takeshi.backend.exception;

/** A failed call to the Azure AI Speech pronunciation assessment API. */
public class AzureSpeechApiException extends UpstreamApiException {

    public AzureSpeechApiException(int statusCode, String responseBody) {
        super("Azure Speech", statusCode, responseBody);
    }

    @Override
    public String getErrorCode() {
        return isThrottledOrOutOfQuota()
                ? "SCORING_QUOTA_EXCEEDED"
                : "SCORING_UNAVAILABLE";
    }
}
