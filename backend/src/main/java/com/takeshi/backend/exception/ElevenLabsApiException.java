package com.takeshi.backend.exception;

public class ElevenLabsApiException extends RuntimeException {
    private final int statusCode;

    public ElevenLabsApiException(int statusCode) {
        super("ElevenLabs API error: " + statusCode);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
