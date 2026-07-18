package com.abhyas.healthtracker.hydration;

import com.abhyas.healthtracker.user.User;
import com.abhyas.healthtracker.user.UserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hydration")
@RequiredArgsConstructor
public class WaterEntryController {

    private final WaterEntryService service;
    private final UserResolver userResolver;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WaterEntry log(HttpServletRequest request, @RequestBody WaterRequest body) {
        User user = userResolver.resolve(request);
        return service.log(user, body);
    }

    @GetMapping
    public List<WaterEntry> all(HttpServletRequest request) {
        User user = userResolver.resolve(request);
        return service.all(user);
    }

    @GetMapping("/today")
    public DailyHydrationSummary today(HttpServletRequest request) {
        User user = userResolver.resolve(request);
        return service.todaySummary(user);
    }

    @GetMapping("/current-session")
    public DailyHydrationSummary currentSession(HttpServletRequest request) {
        User user = userResolver.resolve(request);
        return service.currentSessionSummary(user);
    }

    @GetMapping("/day/{date}")
    public DailyHydrationSummary day(HttpServletRequest request, @PathVariable String date) {
        User user = userResolver.resolve(request);
        return service.summaryForDate(user, LocalDate.parse(date));
    }

    @GetMapping("/insights")
    public HydrationInsights insights(HttpServletRequest request,
                                      @RequestParam(defaultValue = "7") int days) {
        User user = userResolver.resolve(request);
        return service.insights(user, days);
    }

    @PutMapping("/{id}")
    public WaterEntry update(HttpServletRequest request, @PathVariable Long id, @RequestBody WaterRequest body) {
        User user = userResolver.resolve(request);
        return service.update(user, id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(HttpServletRequest request, @PathVariable Long id) {
        User user = userResolver.resolve(request);
        service.delete(user, id);
    }
}
