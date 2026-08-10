# Health Tracker

Playwright dir: .playwright-cli/

## The app's goal
Help Kavya and Abhyas each reach body-composition goals that are the *opposite* of each other, without either one drifting into unhealthy habits to get there. Every feature should serve one of these two goals. If a change doesn't help one of them get closer to their actual goal, it doesn't belong.

- **Kavya** wants to lose weight sustainably — fat loss and muscle gain, not just a falling number on the scale. She trains heavy(4 days gym + 4 days swimming) and needs the app to protect performance and strength, not just cut calories. A "successful" week for her is fat down, muscle steady or up, workouts unaffected. The scale and calorie count eating alone is a bad signal for her and should never be presented as the primary metric.
- **Abhyas** is lean and needs to gain muscle without turning it into an excuse to eat carelessly. Naive "just eat more" advice is wrong for him — it risks fat gain and poor heart health instead of muscle. A "successful" week for him is weight up, strength up, without a spike in low-quality/high-fat intake.

Because the two users have opposite goals from the same raw inputs (weight, calories, protein, workouts), insights must be **goal-relative per user**, never a single global interpretation of the numbers. The same data point (e.g. "calories up this week") is good news for one user and a warning sign for the other.

## Known future scope (always keep this in mind)
Before touching any file, ask: will the known upcoming work require changes to this same file? If yes, design for both now.

Planned roadmap:
- **Per-user goals** — goal type (fat loss / muscle gain), target rate, and constraints (e.g. protein floor, heart-health guardrails) stored per `User`, not hardcoded
- **Body composition tracking** — weight is not enough; need a way to capture/estimate fat vs. muscle trend, not just total mass
- **Workout/strength logging** — training data as a first-class input, not an afterthought, so insights can check "is performance holding up" for Kavya and "is strength climbing" for Abhyas
- **Goal-relative insights** — the same signal (calorie surplus, protein intake, weight trend) interpreted differently depending on which user and which goal it's evaluated against
- **Guardrails, not just targets** — flag when Abhyas's surplus is coming from low-quality food, or when Kavya's deficit is steep enough to risk muscle loss or performance drop

## Architecture principle: design for the pipeline, not the patch
The insights system is (or should become) a pipeline:
```
raw data (meals, hydration, weight, workouts) → per-user goal context → trend/derived metrics → goal-relative evaluation → visualization/feedback
```
Every feature touches some stage of this pipeline. Do not patch one stage without considering how the others connect to it. `MealInsightsService`/`DietInsights` and `HydrationInsights` currently compute plain averages with no goal context — extending them for goal-relative insights means threading the user's goal through the pipeline, not bolting a special case onto the output.

## Do not implement, then rework, then rework again
Each rework introduces a new "opinion" into the codebase. Design once, implement incrementally *within* that design. The difference is:
- Wrong: implement raw averages → rework to add goals → rework again for body composition → rework again for workouts
- Right: design the full pipeline shape (data → goal context → evaluation → feedback) → implement per-user goals within it → add body composition within it → add workouts within it

## Before writing any code
1. Identify every file the change touches (`user/`, `meal/`, `hydration/`, and any new `goal`/`workout` package)
2. Check if any planned future feature (goals, body composition, workouts, guardrails) also touches those files
3. If yes, design the interface/contract to accommodate both before writing implementation
4. Never present insights or advice as one-size-fits-all across Kavya and Abhyas — always resolve through the user's goal first