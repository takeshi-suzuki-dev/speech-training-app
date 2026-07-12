package com.takeshi.backend.exception;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AzureSpeechApiException.class)
    public ResponseEntity<Map<String, Object>> handleAzureSpeechApiException(AzureSpeechApiException e) {
        return ResponseEntity.status(e.getStatusCode()).body(
                Map.of(
                        "error",
                        "AZURE_SPEECH_API_ERROR",
                        "message",
                        e.getMessage(),
                        "statusCode",
                        e.getStatusCode()));
    }

    @ExceptionHandler(ElevenLabsApiException.class)
    public ResponseEntity<Map<String, Object>> handleElevenLabsApiException(ElevenLabsApiException e) {
        return ResponseEntity.status(e.getStatusCode()).body(
                Map.of(
                        "error",
                        "ELEVENLABS_API_ERROR",
                        "message",
                        e.getMessage(),
                        "statusCode",
                        e.getStatusCode()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(
                Map.of(
                        "error",
                        "INVALID_REQUEST",
                        "message",
                        e.getMessage(),
                        "statusCode",
                        400));
    }

    /**
     * Failures a service has already classified: 404 for a sentence that is not the caller's, 400
     * for a missing category, and so on.
     *
     * <p>This handler must exist, and must stay ahead of the catch-all below. {@code Exception}
     * matches {@link ResponseStatusException} too, and an unqualified catch-all reports every such
     * failure to the client as a 500 "Unexpected server error", discarding the status the service
     * deliberately chose. These are expected outcomes rather than server faults, so the chosen
     * status is passed through and they are logged at WARN.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException e) {
        int statusCode = e.getStatusCode().value();
        String message = e.getReason() != null ? e.getReason() : "Request could not be completed.";

        logger.warn("Request rejected with status {}: {}", statusCode, message);

        return ResponseEntity.status(statusCode).body(
                Map.of(
                        "error",
                        "REQUEST_REJECTED",
                        "message",
                        message,
                        "statusCode",
                        statusCode));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        logger.error("Unexpected server error", e);

        return ResponseEntity.internalServerError().body(
                Map.of(
                        "error",
                        "INTERNAL_SERVER_ERROR",
                        "message",
                        "Unexpected server error",
                        "statusCode",
                        500));
    }
}
