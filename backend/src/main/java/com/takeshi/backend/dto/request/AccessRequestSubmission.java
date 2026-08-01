package com.takeshi.backend.dto.request;

/**
 * Submitted from the public landing page by someone asking for demo access.
 *
 * <p>{@code website} is a honeypot: it is hidden from real users, so any value
 * in it indicates an automated submission.
 */
public record AccessRequestSubmission(
        String name,
        String email,
        String message,
        String website) {
}
