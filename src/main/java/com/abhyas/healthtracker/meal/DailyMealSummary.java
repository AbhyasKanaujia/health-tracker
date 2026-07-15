package com.abhyas.healthtracker.meal;

import java.util.List;

public record DailyMealSummary(
        List<FoodEntry> entries,
        int totalCalories,
        double totalProteinGrams
) {}
