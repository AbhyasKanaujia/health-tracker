package com.abhyas.healthtracker.meal;

import com.abhyas.healthtracker.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface FoodEntryRepository extends JpaRepository<FoodEntry, Long> {
    List<FoodEntry> findByUserAndEatenAtBetween(User user, LocalDateTime start, LocalDateTime end);
    List<FoodEntry> findByUser(User user);
    List<FoodEntry> findByUserOrderByEatenAtDesc(User user);
}
