package com.abhyas.healthtracker.meal;

import com.abhyas.healthtracker.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class MealInsightsService {

    private final FoodEntryRepository repository;

    public DietInsights insights(User user, int days) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.minusDays(days - 1).atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        Map<LocalDate, List<FoodEntry>> byDate = repository
                .findByUserAndEatenAtBetween(user, start, end)
                .stream()
                .collect(Collectors.groupingBy(e -> e.getEatenAt().toLocalDate()));

        List<DailyStats> dailyStats = IntStream.range(0, days)
                .mapToObj(i -> today.minusDays(days - 1 - i))
                .map(date -> {
                    List<FoodEntry> dayEntries = byDate.getOrDefault(date, List.of());
                    int cal = dayEntries.stream().mapToInt(FoodEntry::getCalories).sum();
                    double prot = dayEntries.stream().mapToDouble(FoodEntry::getProteinGrams).sum();
                    return new DailyStats(date, cal, prot, dayEntries.size());
                })
                .toList();

        List<DailyStats> loggedDays = dailyStats.stream().filter(s -> s.entryCount() > 0).toList();
        int daysLogged = loggedDays.size();
        int avgCalories = daysLogged > 0
                ? (int) loggedDays.stream().mapToInt(DailyStats::totalCalories).average().orElse(0)
                : 0;
        double avgProtein = daysLogged > 0
                ? loggedDays.stream().mapToDouble(DailyStats::totalProteinGrams).average().orElse(0)
                : 0;

        return new DietInsights(avgCalories, avgProtein, daysLogged, dailyStats);
    }
}
