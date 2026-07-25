package com.takeshi.backend.config;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {

    /**
     * Raw service account JSON. Injected from Secrets Manager in production.
     * When blank, falls back to Application Default Credentials
     * (GOOGLE_APPLICATION_CREDENTIALS file path) for local development.
     */
    @Value("${firebase.credentials-json:}")
    private String credentialsJson;

    @PostConstruct
    public void initializeFirebase() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        GoogleCredentials credentials = resolveCredentials();

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();

        FirebaseApp.initializeApp(options);
    }

    private GoogleCredentials resolveCredentials() throws IOException {
        if (credentialsJson != null && !credentialsJson.isBlank()) {
            try (ByteArrayInputStream in = new ByteArrayInputStream(
                    credentialsJson.getBytes(StandardCharsets.UTF_8))) {
                return GoogleCredentials.fromStream(in);
            }
        }
        return GoogleCredentials.getApplicationDefault();
    }
}
