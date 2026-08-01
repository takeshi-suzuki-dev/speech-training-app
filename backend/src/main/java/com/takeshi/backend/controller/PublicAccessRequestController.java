package com.takeshi.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.takeshi.backend.dto.request.AccessRequestSubmission;
import com.takeshi.backend.service.AccessRequestService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Deliberately mapped under /public rather than /api, because
 * FirebaseAuthenticationInterceptor guards /api/** and this endpoint has to be
 * reachable by visitors who have not signed in.
 */
@RestController
@RequestMapping("/public/access-requests")
public class PublicAccessRequestController {

    private final AccessRequestService accessRequestService;

    public PublicAccessRequestController(AccessRequestService accessRequestService) {
        this.accessRequestService = accessRequestService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> submit(
            @RequestBody AccessRequestSubmission submission,
            HttpServletRequest request) {

        accessRequestService.submit(submission, resolveClientAddress(request));

        return Map.of("status", "ACCEPTED");
    }

    /**
     * Requests arrive through CloudFront and the load balancer, so the socket
     * address is an internal one. The originating address is the first entry of
     * X-Forwarded-For.
     */
    private String resolveClientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");

        if (forwarded == null || forwarded.isBlank()) {
            return request.getRemoteAddr();
        }

        return forwarded.split(",")[0].trim();
    }
}
