package com.takeshi.backend.exception;

public class AzureSpeechApiException extends RuntimeException {
    private final int statusCode;

    public AzureSpeechApiException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
