package com.abhyas.healthtracker.meal;

import java.time.LocalDateTime;

public record FoodEntryRequest(
        String name,
        int calories,
        double proteinGrams,
        LocalDateTime eatenAt
) {}
