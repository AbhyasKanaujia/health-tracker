package com.abhyas.healthtracker.hydration;

import java.util.List;

public record HydrationInsights(double avgLitres, int daysLogged, List<DailyHydrationStats> days) {}
