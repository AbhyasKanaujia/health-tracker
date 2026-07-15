package com.abhyas.healthtracker.user;

import jakarta.servlet.http.HttpServletRequest;

public interface UserResolver {
    User resolve(HttpServletRequest request);
}
