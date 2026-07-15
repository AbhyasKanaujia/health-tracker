package com.abhyas.healthtracker.user;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Component
@RequiredArgsConstructor
public class HeaderBasedUserResolver implements UserResolver {

    private final UserRepository userRepository;

    @Override
    public User resolve(HttpServletRequest request) {
        String header = request.getHeader("X-User-Id");
        if (header == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-User-Id header is required");
        }
        long userId;
        try {
            userId = Long.parseLong(header);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-User-Id must be a numeric user ID");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }
}
