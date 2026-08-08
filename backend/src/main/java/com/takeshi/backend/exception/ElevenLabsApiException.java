package com.takeshi.backend.exception;

/** A failed call to the ElevenLabs text-to-speech API. */
public class ElevenLabsApiException extends UpstreamApiException {

    public ElevenLabsApiException(int statusCode, String responseBody) {
        super("ElevenLabs", statusCode, responseBody);
    }

    @Override
    public String getErrorCode() {
        return isThrottledOrOutOfQuota() ? "TTS_QUOTA_EXCEEDED" : "TTS_UNAVAILABLE";
    }
}
