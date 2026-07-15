package com.abhyas.healthtracker.meal;

import java.util.List;

public record DietInsights(int avgCalories, double avgProteinGrams, int daysLogged, List<DailyStats> days) {}
