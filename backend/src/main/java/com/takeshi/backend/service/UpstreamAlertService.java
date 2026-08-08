package com.takeshi.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.takeshi.backend.exception.UpstreamApiException;

import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

/**
 * Tells the owner when a third-party dependency stops working.
 *
 * <p>Nobody watches the logs of a demo. Without this, an exhausted quota is
 * discovered only when someone finds the feature broken — which, for an
 * application shared with recruiters, is the worst way to find out.
 */
@Service
public class UpstreamAlertService {

    private static final Logger log = LoggerFactory.getLogger(UpstreamAlertService.class);

    /**
     * One alert per error code per hour.
     *
     * <p>An exhausted quota fails every subsequent request, so alerting on each
     * one would bury the first — the only one that carries new information.
     */
    private static final Duration ALERT_INTERVAL = Duration.ofHours(1);

    /** Enough of the upstream body to diagnose from, without mailing a whole payload. */
    private static final int MAX_BODY_CHARS = 1000;

    private final Map<String, Instant> lastAlertByErrorCode = new ConcurrentHashMap<>();

    private final SnsClient snsClient;
    private final String topicArn;

    public UpstreamAlertService(
            SnsClient snsClient,
            @Value("${app.alert.topic-arn:}") String topicArn) {
        this.snsClient = snsClient;
        this.topicArn = topicArn;
    }

    public void alert(UpstreamApiException exception) {
        if (topicArn.isBlank()) {
            return;
        }

        if (!shouldAlert(exception.getErrorCode())) {
            return;
        }

        try {
            snsClient.publish(PublishRequest.builder()
                    .topicArn(topicArn)
                    .subject("Cadence alert: " + exception.getErrorCode())
                    .message(buildMessage(exception))
                    .build());
        } catch (RuntimeException e) {
            // Alerting must never turn a handled upstream failure into a broken
            // response, so this is logged and swallowed.
            log.error("Failed to publish an upstream alert", e);
        }
    }

    /**
     * @return true the first time this code is seen in the current window, and
     *         false for the rest of it.
     */
    private boolean shouldAlert(String errorCode) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(ALERT_INTERVAL);

        // computeIfPresent + putIfAbsent would race; merge decides and records
        // in one atomic step.
        Instant recorded = lastAlertByErrorCode.merge(
                errorCode,
                now,
                (previous, candidate) -> previous.isBefore(cutoff) ? candidate : previous);

        return recorded.equals(now);
    }

    private String buildMessage(UpstreamApiException exception) {
        String body = exception.getResponseBody();

        if (body.length() > MAX_BODY_CHARS) {
            body = body.substring(0, MAX_BODY_CHARS) + "... (truncated)";
        }

        return """
                A third-party dependency failed.

                Error code:      %s
                Upstream status: %d
                Out of quota:    %s
                Time (UTC):      %s

                Upstream response:
                %s

                Further failures with this error code are suppressed for %d minutes.
                """
                .formatted(
                        exception.getErrorCode(),
                        exception.getStatusCode(),
                        exception.isThrottledOrOutOfQuota() ? "yes" : "no",
                        Instant.now(),
                        body.isBlank() ? "(empty)" : body,
                        ALERT_INTERVAL.toMinutes());
    }
}
