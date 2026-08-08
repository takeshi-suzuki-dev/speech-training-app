package com.takeshi.backend.exception;

import java.util.Locale;

/**
 * A failed call to a third-party API this application depends on.
 *
 * <p>The response body is kept because the status code alone does not say what
 * went wrong: an exhausted quota and a rejected credential can arrive with the
 * same code, and only the body distinguishes them.
 *
 * <p>Subclasses decide what the client is told. The upstream's own status and
 * wording are deliberately not forwarded — a 401 from a vendor would otherwise
 * reach the browser as "your session expired", asking a signed-in user to sign
 * in again over a failure that has nothing to do with them.
 */
public abstract class UpstreamApiException extends RuntimeException {

    private final int statusCode;
    private final String responseBody;

    protected UpstreamApiException(String serviceName, int statusCode, String responseBody) {
        super(serviceName + " API error: " + statusCode);
        this.statusCode = statusCode;
        this.responseBody = responseBody == null ? "" : responseBody;
    }

    public int getStatusCode() {
        return statusCode;
    }

    /** The upstream's own response, forwarded to the owner but never to the client. */
    public String getResponseBody() {
        return responseBody;
    }

    /**
     * Whether the call failed because capacity ran out rather than because
     * something is broken. Vendors signal this either with 429 or by naming a
     * quota in the body, so both are checked.
     */
    public boolean isThrottledOrOutOfQuota() {
        return statusCode == 429
                || responseBody.toLowerCase(Locale.ROOT).contains("quota");
    }

    /**
     * Wording shown to the person.
     *
     * <p>Which vendor failed, and why, is internal: naming a third party's
     * quota would expose how the service is run without helping the person in
     * front of it. All they need is whether waiting will fix it.
     */
    public String getUserMessage() {
        if (isThrottledOrOutOfQuota()) {
            return "This feature is temporarily unavailable. "
                    + "Please try again later.";
        }

        return "Something went wrong. Please contact the developer if this "
                + "keeps happening.";
    }

    /** Machine-readable code for the client and for support requests. */
    public abstract String getErrorCode();
}
