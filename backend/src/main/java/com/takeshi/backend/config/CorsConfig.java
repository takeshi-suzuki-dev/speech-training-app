package com.takeshi.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.takeshi.backend.auth.FirebaseAuthenticationInterceptor;

@Configuration
public class CorsConfig {

    private final FirebaseAuthenticationInterceptor firebaseAuthenticationInterceptor;

    public CorsConfig(FirebaseAuthenticationInterceptor firebaseAuthenticationInterceptor) {
        this.firebaseAuthenticationInterceptor = firebaseAuthenticationInterceptor;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }

            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(firebaseAuthenticationInterceptor)
                        .addPathPatterns("/api/**");
            }
        };
    }
}