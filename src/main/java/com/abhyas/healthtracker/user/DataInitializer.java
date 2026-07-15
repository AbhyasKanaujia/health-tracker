package com.abhyas.healthtracker.user;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            userRepository.save(User.builder().username("abhyas").displayName("Abhyas").build());
            userRepository.save(User.builder().username("kavya").displayName("Kavya").build());
        }
    }
}
