package com.abhyas.healthtracker.meal;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class MealAnalyzerService {

    private final ObjectMapper objectMapper;
    private final RestClient ollamaClient;

    public MealAnalyzerService(ObjectMapper objectMapper,
                               @Value("${ollama.base-url}") String ollamaBaseUrl) {
        this.objectMapper = objectMapper;
        this.ollamaClient = RestClient.builder().baseUrl(ollamaBaseUrl).build();
    }

    private String stripMarkdown(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('\n') + 1;
            int end = trimmed.lastIndexOf("```");
            return trimmed.substring(start, end).trim();
        }
        return trimmed;
    }

    public NutritionEstimate estimate(String foodName) {
        String prompt = String.format(
                "Estimate the nutritional content for a typical serving of: \"%s\". " +
                "Return ONLY a JSON object with exactly these two fields: " +
                "{\"calories\": <integer>, \"proteinGrams\": <number>}. " +
                "No explanation, no extra text.", foodName);

        Map<String, Object> requestBody = Map.of(
                "model", "gemma4:cloud",
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "format", "json",
                "stream", false
        );

        try {
            Map<?, ?> response = ollamaClient.post()
                    .uri("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            String content = (String) ((Map<?, ?>) response.get("message")).get("content");
            return objectMapper.readValue(stripMarkdown(content), NutritionEstimate.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze meal: " + e.getMessage(), e);
        }
    }
}
