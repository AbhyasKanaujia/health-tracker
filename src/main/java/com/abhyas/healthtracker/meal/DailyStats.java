package com.abhyas.healthtracker.meal;

import java.time.LocalDate;
import java.time.LocalTime;

public record DailyStats(LocalDate date, int totalCalories, double totalProteinGrams, int entryCount,
                         LocalTime eatingWindowStart, LocalTime eatingWindowEnd, double eatingWindowHours) {}
