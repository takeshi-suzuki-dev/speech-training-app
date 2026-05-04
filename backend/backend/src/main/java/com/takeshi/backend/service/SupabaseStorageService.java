package com.takeshi.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.storage.bucket}")
    private String bucketName;

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadMp3(String objectPath, byte[] mp3Bytes) {
        String url = supabaseUrl
                + "/storage/v1/object/"
                + bucketName
                + "/"
                + objectPath;

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", serviceRoleKey);
        headers.setBearerAuth(serviceRoleKey);
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        headers.setCacheControl(CacheControl.maxAge(3600, java.util.concurrent.TimeUnit.SECONDS));
        headers.set("x-upsert", "true");

        HttpEntity<byte[]> request = new HttpEntity<>(mp3Bytes, headers);

        restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                String.class
        );

        return objectPath;
    }

    public String buildPublicUrl(String objectPath) {
        return supabaseUrl
                + "/storage/v1/object/public/"
                + bucketName
                + "/"
                + objectPath;
    }
}
