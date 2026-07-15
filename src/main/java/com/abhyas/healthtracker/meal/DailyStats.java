package com.abhyas.healthtracker.meal;

import java.time.LocalDate;

public record DailyStats(LocalDate date, int totalCalories, double totalProteinGrams, int entryCount) {}
