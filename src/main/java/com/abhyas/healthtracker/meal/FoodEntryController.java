package com.abhyas.healthtracker.meal;

import com.abhyas.healthtracker.user.User;
import com.abhyas.healthtracker.user.UserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class FoodEntryController {

    private final FoodEntryService service;
    private final MealAnalyzerService analyzerService;
    private final MealInsightsService insightsService;
    private final UserResolver userResolver;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FoodEntry log(HttpServletRequest request, @RequestBody FoodEntryRequest body) {
        User user = userResolver.resolve(request);
        return service.log(user, body);
    }

    @GetMapping
    public List<FoodEntry> all(HttpServletRequest request) {
        User user = userResolver.resolve(request);
        return service.all(user);
    }

    @GetMapping("/today")
    public DailyMealSummary today(HttpServletRequest request) {
        User user = userResolver.resolve(request);
        return service.todaySummary(user);
    }

    @GetMapping("/current-session")
    public DailyMealSummary currentSession(HttpServletRequest request) {
        User user = userResolver.resolve(request);
        return service.currentSessionSummary(user);
    }

    @GetMapping("/day/{date}")
    public DailyMealSummary day(HttpServletRequest request, @PathVariable String date) {
        User user = userResolver.resolve(request);
        return service.summaryForDate(user, LocalDate.parse(date));
    }

    @GetMapping("/insights")
    public DietInsights insights(HttpServletRequest request,
                                 @RequestParam(defaultValue = "7") int days) {
        User user = userResolver.resolve(request);
        return insightsService.insights(user, days);
    }

    @PutMapping("/{id}")
    public FoodEntry update(HttpServletRequest request, @PathVariable Long id, @RequestBody FoodEntryRequest body) {
        User user = userResolver.resolve(request);
        return service.update(user, id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(HttpServletRequest request, @PathVariable Long id) {
        User user = userResolver.resolve(request);
        service.delete(user, id);
    }

    @PostMapping("/analyze")
    public NutritionEstimate analyze(@RequestBody Map<String, String> body) {
        return analyzerService.estimate(body.get("name"));
    }
}
