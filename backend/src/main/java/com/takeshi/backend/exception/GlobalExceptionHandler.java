package com.takeshi.backend.exception;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.takeshi.backend.service.UpstreamAlertService;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final UpstreamAlertService upstreamAlertService;

    public GlobalExceptionHandler(UpstreamAlertService upstreamAlertService) {
        this.upstreamAlertService = upstreamAlertService;
    }

    /**
     * One handler for every third-party dependency: the client is told the same
     * two things regardless of which vendor failed — whether capacity ran out,
     * and that the fault is not theirs.
     */
    @ExceptionHandler(UpstreamApiException.class)
    public ResponseEntity<Map<String, Object>> handleUpstreamApiException(UpstreamApiException e) {
        HttpStatus status = e.isThrottledOrOutOfQuota()
                ? HttpStatus.TOO_MANY_REQUESTS
                : HttpStatus.BAD_GATEWAY;

        logger.warn(
                "Upstream call failed. error={}, upstreamStatus={}, respondingWith={}",
                e.getErrorCode(),
                e.getStatusCode(),
                status.value());

        upstreamAlertService.alert(e);

        return ResponseEntity.status(status).body(
                Map.of(
                        "error",
                        e.getErrorCode(),
                        "message",
                        e.getUserMessage(),
                        "statusCode",
                        status.value(),
                        "upstreamStatusCode",
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
