package com.abhyas.healthtracker.hydration;

import com.abhyas.healthtracker.meal.FoodEntryService;
import com.abhyas.healthtracker.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class WaterEntryService {

    private final WaterEntryRepository repository;

    public WaterEntry log(User user, WaterRequest request) {
        WaterEntry entry = WaterEntry.builder()
                .user(user)
                .amountLitres(request.amountLitres())
                .loggedAt(request.loggedAt() != null ? request.loggedAt() : LocalDateTime.now())
                .build();
        return repository.save(entry);
    }

    public List<WaterEntry> all(User user) {
        return repository.findByUser(user);
    }

    public WaterEntry update(User user, Long id, WaterRequest request) {
        WaterEntry entry = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        if (!entry.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Entry does not belong to this user");
        }
        entry.setAmountLitres(request.amountLitres());
        if (request.loggedAt() != null) entry.setLoggedAt(request.loggedAt());
        return repository.save(entry);
    }

    public void delete(User user, Long id) {
        WaterEntry entry = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        if (!entry.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Entry does not belong to this user");
        }
        repository.delete(entry);
    }

    public DailyHydrationSummary summaryForDate(User user, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        List<WaterEntry> entries = repository.findByUserAndLoggedAtBetween(user, start, end);
        double totalLitres = entries.stream().mapToDouble(WaterEntry::getAmountLitres).sum();
        return new DailyHydrationSummary(entries, totalLitres);
    }

    public DailyHydrationSummary todaySummary(User user) {
        return summaryForDate(user, LocalDate.now());
    }

    public DailyHydrationSummary currentSessionSummary(User user) {
        List<WaterEntry> all = repository.findByUserOrderByLoggedAtDesc(user);
        if (all.isEmpty()) return new DailyHydrationSummary(List.of(), 0.0);
        if (Duration.between(all.get(0).getLoggedAt(), LocalDateTime.now()).toHours() >= FoodEntryService.SESSION_GAP_HOURS) {
            return new DailyHydrationSummary(List.of(), 0.0);
        }
        List<WaterEntry> session = new ArrayList<>();
        session.add(all.get(0));
        for (int i = 1; i < all.size(); i++) {
            Duration gap = Duration.between(all.get(i).getLoggedAt(), all.get(i - 1).getLoggedAt());
            if (gap.toHours() >= FoodEntryService.SESSION_GAP_HOURS) break;
            session.add(all.get(i));
        }
        double totalLitres = session.stream().mapToDouble(WaterEntry::getAmountLitres).sum();
        return new DailyHydrationSummary(session, totalLitres);
    }

    public HydrationInsights insights(User user, int days) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.minusDays(days - 1).atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        Map<LocalDate, List<WaterEntry>> byDate = repository
                .findByUserAndLoggedAtBetween(user, start, end)
                .stream()
                .collect(Collectors.groupingBy(e -> e.getLoggedAt().toLocalDate()));

        List<DailyHydrationStats> dailyStats = IntStream.range(0, days)
                .mapToObj(i -> today.minusDays(days - 1 - i))
                .map(date -> {
                    List<WaterEntry> dayEntries = byDate.getOrDefault(date, List.of());
                    double litres = dayEntries.stream().mapToDouble(WaterEntry::getAmountLitres).sum();
                    return new DailyHydrationStats(date, litres, dayEntries.size());
                })
                .toList();

        List<DailyHydrationStats> loggedDays = dailyStats.stream().filter(s -> s.entryCount() > 0).toList();
        int daysLogged = loggedDays.size();
        double avgLitres = daysLogged > 0
                ? loggedDays.stream().mapToDouble(DailyHydrationStats::totalLitres).average().orElse(0)
                : 0;

        return new HydrationInsights(avgLitres, daysLogged, dailyStats);
    }
}
