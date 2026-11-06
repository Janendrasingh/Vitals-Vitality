import assert from "node:assert/strict";
import test from "node:test";
import { calculateDailyNutritionBalance } from "./dailyNutritionBalance.js";

const targets = {
  calorieTarget: 2000,
  proteinTarget: 120,
  carbohydrateTarget: 220,
  fatTarget: 65,
};

test("calculates remaining calories and macros from logged meals", () => {
  const result = calculateDailyNutritionBalance(targets, [
    { calories: 500, protein: 25, carbs: 60, fat: 15 },
    { calories: 300, protein: 20, carbohydrates: 40, fat: 10 },
  ]);

  assert.deepEqual(result.consumed, {
    calories: 800,
    protein: 45,
    carbohydrates: 100,
    fat: 25,
  });
  assert.deepEqual(result.remaining, {
    calories: 1200,
    protein: 75,
    carbohydrates: 120,
    fat: 40,
  });
  assert.equal(result.available, true);
  assert.deepEqual(result.errors, []);
});

test("treats an empty meal log as zero consumed and preserves zero-valued targets", () => {
  const result = calculateDailyNutritionBalance({
    calorieTarget: 0,
    proteinTarget: 0,
    carbohydrateTarget: 0,
    fatTarget: 0,
  }, []);

  assert.deepEqual(result.consumed, {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
  });
  assert.deepEqual(result.remaining, result.consumed);
  assert.equal(result.available, true);
});

test("keeps remaining nutrients unavailable instead of treating missing logged values as zero", () => {
  const result = calculateDailyNutritionBalance(targets, [
    { calories: 500, protein: 20, carbs: 40, fat: 10 },
    { calories: 250, protein: null, carbs: 30, fat: 8 },
  ]);

  assert.equal(result.consumed.calories, 750);
  assert.equal(result.remaining.calories, 1250);
  assert.equal(result.consumed.protein, null);
  assert.equal(result.remaining.protein, null);
  assert.equal(result.remaining.carbohydrates, 150);
  assert.equal(result.remaining.fat, 47);
  assert.equal(result.available, false);
  assert.ok(result.errors.some((error) => /protein.*missing valid protein data/.test(error)));
});

test("handles invalid profile targets and invalid logged values explicitly", () => {
  const result = calculateDailyNutritionBalance({
    ...targets,
    calorieTarget: "not a number",
  }, [{ calories: "", protein: -1, carbs: 10, fat: 4 }]);

  assert.equal(result.consumed.calories, null);
  assert.equal(result.remaining.calories, null);
  assert.equal(result.remaining.protein, null);
  assert.equal(result.remaining.carbohydrates, 210);
  assert.equal(result.remaining.fat, 61);
  assert.equal(result.available, false);
});

test("does not interpret missing meal lists as an empty meal log", () => {
  const result = calculateDailyNutritionBalance(targets, null);

  assert.equal(result.available, false);
  assert.ok(result.errors.some((error) => /Logged meals must be an array/.test(error)));
  assert.equal(result.remaining.calories, null);
});
