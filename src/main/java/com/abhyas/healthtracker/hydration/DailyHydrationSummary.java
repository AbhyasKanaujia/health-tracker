package com.abhyas.healthtracker.hydration;

import java.util.List;

public record DailyHydrationSummary(
        List<WaterEntry> entries,
        double totalLitres
) {}
