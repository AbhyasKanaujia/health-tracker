package com.abhyas.healthtracker.meal;

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

@Service
@RequiredArgsConstructor
public class FoodEntryService {

    private final FoodEntryRepository repository;

    public FoodEntry log(User user, FoodEntryRequest request) {
        FoodEntry entry = FoodEntry.builder()
                .user(user)
                .name(request.name())
                .calories(request.calories())
                .proteinGrams(request.proteinGrams())
                .eatenAt(request.eatenAt() != null ? request.eatenAt() : LocalDateTime.now())
                .build();
        return repository.save(entry);
    }

    public List<FoodEntry> all(User user) {
        return repository.findByUser(user);
    }

    public FoodEntry update(User user, Long id, FoodEntryRequest request) {
        FoodEntry entry = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        if (!entry.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Entry does not belong to this user");
        }
        entry.setName(request.name());
        entry.setCalories(request.calories());
        entry.setProteinGrams(request.proteinGrams());
        if (request.eatenAt() != null) entry.setEatenAt(request.eatenAt());
        return repository.save(entry);
    }

    public void delete(User user, Long id) {
        FoodEntry entry = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        if (!entry.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Entry does not belong to this user");
        }
        repository.delete(entry);
    }

    public DailyMealSummary summaryForDate(User user, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        List<FoodEntry> entries = repository.findByUserAndEatenAtBetween(user, start, end);
        int totalCalories = entries.stream().mapToInt(FoodEntry::getCalories).sum();
        double totalProtein = entries.stream().mapToDouble(FoodEntry::getProteinGrams).sum();
        return new DailyMealSummary(entries, totalCalories, totalProtein);
    }

    public DailyMealSummary todaySummary(User user) {
        return summaryForDate(user, LocalDate.now());
    }

    public static final int SESSION_GAP_HOURS = 10;

    public DailyMealSummary currentSessionSummary(User user) {
        List<FoodEntry> all = repository.findByUserOrderByEatenAtDesc(user);
        if (all.isEmpty()) return new DailyMealSummary(List.of(), 0, 0.0);
        if (Duration.between(all.get(0).getEatenAt(), LocalDateTime.now()).toHours() >= SESSION_GAP_HOURS) {
            return new DailyMealSummary(List.of(), 0, 0.0);
        }
        List<FoodEntry> session = new ArrayList<>();
        session.add(all.get(0));
        for (int i = 1; i < all.size(); i++) {
            Duration gap = Duration.between(all.get(i).getEatenAt(), all.get(i - 1).getEatenAt());
            if (gap.toHours() >= SESSION_GAP_HOURS) break;
            session.add(all.get(i));
        }
        int totalCalories = session.stream().mapToInt(FoodEntry::getCalories).sum();
        double totalProtein = session.stream().mapToDouble(FoodEntry::getProteinGrams).sum();
        return new DailyMealSummary(session, totalCalories, totalProtein);
    }
}
