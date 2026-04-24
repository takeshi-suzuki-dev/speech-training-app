package com.takeshi.backend.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AzureSpeechApiException.class)
    public ResponseEntity<Map<String, Object>> handleAzureSpeechApiException(
            AzureSpeechApiException e
    ) {
        return ResponseEntity
                .status(e.getStatusCode())
                .body(Map.of(
                        "error", "AZURE_SPEECH_API_ERROR",
                        "message", e.getMessage(),
                        "statusCode", e.getStatusCode()
                ));
    }

    @ExceptionHandler(ElevenLabsApiException.class)
    public ResponseEntity<Map<String, Object>> handleElevenLabsApiException(
            ElevenLabsApiException e
    ) {
        return ResponseEntity
                .status(e.getStatusCode())
                .body(Map.of(
                        "error", "ELEVENLABS_API_ERROR",
                        "message", e.getMessage(),
                        "statusCode", e.getStatusCode()
                ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(
            IllegalArgumentException e
    ) {
        return ResponseEntity
                .badRequest()
                .body(Map.of(
                        "error", "INVALID_REQUEST",
                        "message", e.getMessage(),
                        "statusCode", 400
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        return ResponseEntity
                .internalServerError()
                .body(Map.of(
                        "error", "INTERNAL_SERVER_ERROR",
                        "message", "Unexpected server error",
                        "statusCode", 500
                ));
    }
}
