package com.abhyas.healthtracker.hydration;

import java.time.LocalDate;

public record DailyHydrationStats(LocalDate date, double totalLitres, int entryCount) {}
