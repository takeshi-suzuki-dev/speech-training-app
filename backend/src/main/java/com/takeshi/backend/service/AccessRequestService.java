package com.takeshi.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.takeshi.backend.dto.request.AccessRequestSubmission;

import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

/**
 * Sends demo-access requests from the public landing page to the owner's inbox
 * through an SNS topic.
 *
 * <p>This endpoint is reachable without authentication, so it validates input
 * strictly, drops honeypot submissions, and rate-limits per client address.
 */
@Service
public class AccessRequestService {

    private static final Logger log = LoggerFactory.getLogger(AccessRequestService.class);

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final int MAX_NAME = 100;
    private static final int MAX_EMAIL = 254;
    private static final int MAX_MESSAGE = 2000;

    private static final int MAX_PER_WINDOW = 3;
    private static final Duration WINDOW = Duration.ofHours(1);

    private final Map<String, Deque<Instant>> recentSubmissions = new ConcurrentHashMap<>();

    private final SnsClient snsClient;
    private final String topicArn;

    public AccessRequestService(
            SnsClient snsClient,
            @Value("${app.access-request.topic-arn:}") String topicArn) {
        this.snsClient = snsClient;
        this.topicArn = topicArn;
    }

    public void submit(AccessRequestSubmission submission, String clientAddress) {
        if (submission.website() != null && !submission.website().isBlank()) {
            // Honeypot filled in. Report success so the bot has nothing to learn.
            log.info("Discarded honeypot access request from {}", clientAddress);
            return;
        }

        String name = required(submission.name(), "name", MAX_NAME);
        String email = required(submission.email(), "email", MAX_EMAIL);
        String message = optional(submission.message(), "message", MAX_MESSAGE);

        if (!EMAIL.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A valid email address is required.");
        }

        enforceRateLimit(clientAddress);

        if (topicArn.isBlank()) {
            log.warn("Access request received but no SNS topic is configured. From: {}", email);
            throw new IllegalStateException("Access request notifications are not configured.");
        }

        snsClient.publish(PublishRequest.builder()
                .topicArn(topicArn)
                .subject("Cadence: demo access request")
                .message("""
                        A new demo access request was submitted.

                        Name:  %s
                        Email: %s

                        Message:
                        %s

                        Submitted from: %s
                        """.formatted(name, email,
                        message.isBlank() ? "(none)" : message, clientAddress))
                .build());

        log.info("Access request forwarded for {}", email);
    }

    private void enforceRateLimit(String clientAddress) {
        Instant now = Instant.now();
        Deque<Instant> history = recentSubmissions
                .computeIfAbsent(clientAddress, key -> new ArrayDeque<>());

        synchronized (history) {
            while (!history.isEmpty() && history.peekFirst().isBefore(now.minus(WINDOW))) {
                history.pollFirst();
            }

            if (history.size() >= MAX_PER_WINDOW) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many requests. Please try again later.");
            }

            history.addLast(now);
        }

        if (recentSubmissions.size() > 10_000) {
            recentSubmissions.clear();
        }
    }

    private String required(String value, String field, int maxLength) {
        String trimmed = value == null ? "" : value.trim();

        if (trimmed.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The %s field is required.".formatted(field));
        }

        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The %s field is too long.".formatted(field));
        }

        return trimmed;
    }

    private String optional(String value, String field, int maxLength) {
        String trimmed = value == null ? "" : value.trim();

        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The %s field is too long.".formatted(field));
        }

        return trimmed;
    }
}
