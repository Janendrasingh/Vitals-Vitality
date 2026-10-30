import assert from "node:assert/strict";
import test from "node:test";
import { calculateNutritionTargets } from "./nutritionCalculator.js";

const profile = {
  age: "30",
  weight: "70",
  height: "175",
  gender: "Male",
  activity: "Moderate",
  goal: "Maintenance",
};

test("calculates Mifflin–St Jeor BMR and activity-adjusted TDEE", () => {
  const result = calculateNutritionTargets(profile);

  assert.equal(result.available, true);
  assert.equal(result.bmr, 1649);
  assert.equal(result.tdee, 2556);
  assert.equal(result.calorieTarget, result.tdee);
  assert.equal(result.activityMultiplier, 1.55);
});

test("calculates female BMR using the female equation constant", () => {
  const result = calculateNutritionTargets({ ...profile, gender: "Female" });

  assert.equal(result.bmr, 1483);
  assert.equal(result.tdee, 2299);
});

test("uses the selected activity multiplier and ignores imported active calories", () => {
  const sedentary = calculateNutritionTargets({ ...profile, activity: "Sedentary" });
  const veryActive = calculateNutritionTargets({ ...profile, activity: "Very Active" });
  const withSyncedActivity = calculateNutritionTargets({
    ...profile,
    activeCaloriesKcal: 900,
    workoutDurationMinutes: 120,
    steps: 20000,
  });

  assert.equal(sedentary.tdee, 1979);
  assert.equal(veryActive.tdee, 2845);
  assert.equal(withSyncedActivity.tdee, calculateNutritionTargets(profile).tdee);
});

test("applies a capped, conservative weight-loss deficit no lower than BMR", () => {
  const result = calculateNutritionTargets({ ...profile, goal: "Weight Loss" });

  assert.equal(result.calorieTarget, result.tdee - 500);
  assert.ok(result.calorieTarget >= result.bmr);
});

test("applies a capped muscle-gain surplus", () => {
  const result = calculateNutritionTargets({ ...profile, goal: "Muscle Gain" });

  assert.equal(result.calorieTarget, result.tdee + 256);
  assert.ok(result.calorieTarget <= result.tdee + 300);
});

test("uses body weight and goal to calculate macros close to the calorie target", () => {
  for (const goal of ["Weight Loss", "Muscle Gain", "Maintenance"]) {
    const result = calculateNutritionTargets({ ...profile, goal });

    assert.ok(result.proteinTarget > 0);
    assert.ok(result.carbohydrateTarget > 0);
    assert.ok(result.fatTarget > 0);
    assert.ok(Math.abs(result.macroCalories - result.calorieTarget) <= 10);
  }
});

test("returns an explicit unavailable result for missing or invalid profile data", () => {
  for (const invalidProfile of [
    { ...profile, age: "" },
    { ...profile, weight: "not a number" },
    { ...profile, height: "0" },
    { ...profile, age: "17" },
    { ...profile, gender: "Non-Binary" },
    { ...profile, activity: "" },
    { ...profile, goal: "Unknown" },
    null,
  ]) {
    const result = calculateNutritionTargets(invalidProfile);
    assert.equal(result.available, false);
    assert.equal(result.calorieTarget, null);
    assert.ok(result.error);
  }
});
