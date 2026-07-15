package com.abhyas.healthtracker.meal;

import com.abhyas.healthtracker.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "food_entries")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FoodEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "user_id")
    private User user;

    private String name;
    private int calories;
    private double proteinGrams;
    private LocalDateTime eatenAt;
}
