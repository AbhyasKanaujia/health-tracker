package com.abhyas.healthtracker.meal;

import com.abhyas.healthtracker.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
}
