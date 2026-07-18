package com.abhyas.healthtracker.hydration;

import com.abhyas.healthtracker.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface WaterEntryRepository extends JpaRepository<WaterEntry, Long> {
    List<WaterEntry> findByUserAndLoggedAtBetween(User user, LocalDateTime start, LocalDateTime end);
    List<WaterEntry> findByUser(User user);
    List<WaterEntry> findByUserOrderByLoggedAtDesc(User user);
}
