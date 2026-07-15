package com.abhyas.healthtracker.hydration;

import java.time.LocalDateTime;

public record WaterRequest(
        double amountLitres,
        LocalDateTime loggedAt
) {}
