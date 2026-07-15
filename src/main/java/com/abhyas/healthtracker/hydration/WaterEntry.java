package com.abhyas.healthtracker.hydration;

import com.abhyas.healthtracker.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_entries")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WaterEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "user_id")
    private User user;

    private double amountLitres;
    private LocalDateTime loggedAt;
}
