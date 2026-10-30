import assert from "node:assert/strict";
import test from "node:test";
import { recommendMeals } from "./mealRecommendations.js";

const verifiedMeal = {
  id: "verified-breakfast",
  name: "Example breakfast",
  mealType: "breakfast",
  portionSize: "1 serving",
  calories: 500,
  protein: 25,
  carbohydrates: 60,
  fat: 15,
  ingredients: [{ name: "oats" }],
  allergens: [],
  tags: ["vegan", "vegetarian"],
  sourceName: "Test nutrition source",
  sourceUrl: "https://example.test/food",
  workoutFocus: "strength",
};

test("does not invent recommendations when a verified food source is unavailable", () => {
  const result = recommendMeals({
    source: { meals: [], unavailableReason: "No nutrition source is configured." },
    calorieTarget: 2200,
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.reason, "No nutrition source is configured.");
  assert.deepEqual(result.meals.map((slot) => slot.label), [
    "Breakfast",
    "Lunch",
    "Evening Snacks",
    "Dinner",
  ]);
  assert.equal(result.meals.every((slot) => slot.recommendation === null), true);
});

test("returns four meal slots and selects the closest verified portion", () => {
  const result = recommendMeals({
    source: { meals: [verifiedMeal] },
    calorieTarget: 2000,
    diets: ["Vegan"],
  });

  assert.equal(result.status, "ready");
  assert.deepEqual(result.meals.map((slot) => slot.label), [
    "Breakfast",
    "Lunch",
    "Evening Snacks",
    "Dinner",
  ]);
  assert.equal(result.meals[0].recommendation, verifiedMeal);
  assert.equal(result.meals[1].recommendation, null);
});

test("filters meals against diets, allergies, and explicit food preferences", () => {
  const result = recommendMeals({
    source: {
      meals: [{
        ...verifiedMeal,
        allergens: ["peanut"],
      }],
    },
    calorieTarget: 2000,
    diets: ["Vegan"],
    allergies: ["Peanuts"],
    preferences: ["berries"],
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.meals[0].recommendation, null);
});

test("fails closed for an allergy that the source cannot classify", () => {
  const result = recommendMeals({
    source: { meals: [verifiedMeal] },
    calorieTarget: 2000,
    allergies: ["unclassified allergy"],
  });

  assert.equal(result.status, "unavailable");
});

test("rejects incomplete or unverified nutrition records", () => {
  const result = recommendMeals({
    source: { meals: [{ ...verifiedMeal, sourceUrl: "" }] },
    calorieTarget: 2000,
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.reason, "The configured food source has no complete, verified nutrition records.");
});

test("requires a valid calorie target", () => {
  const result = recommendMeals({ source: { meals: [verifiedMeal] }, calorieTarget: null });

  assert.equal(result.status, "unavailable");
  assert.match(result.reason, /valid daily calorie estimate/);
});
