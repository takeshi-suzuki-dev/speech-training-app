package com.takeshi.backend.exception;

public class AppAccessDeniedException extends RuntimeException {

    public AppAccessDeniedException(String message) {
        super(message);
    }
}