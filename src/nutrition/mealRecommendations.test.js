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

test("allocates recommendations sequentially within the combined calorie allowance", () => {
  const meals = ["breakfast", "lunch", "evening-snacks", "dinner"].map((mealType) => ({
    ...verifiedMeal,
    id: `300-calorie-${mealType}`,
    mealType,
    calories: 300,
  }));
  const result = recommendMeals({
    source: { meals },
    calorieTarget: 2000,
    remainingCalories: 750,
  });
  const recommendedMeals = result.meals
    .map((slot) => slot.recommendation)
    .filter(Boolean);

  assert.equal(result.status, "ready");
  assert.equal(recommendedMeals.length, 2);
  assert.ok(recommendedMeals.reduce((total, meal) => total + meal.calories, 0) <= 750);
  assert.equal(result.meals[2].recommendation, null);
  assert.equal(result.meals[3].recommendation, null);
});

test("scores later slots against the updated calorie and macro budgets", () => {
  const breakfast = {
    ...verifiedMeal,
    id: "250-calorie-breakfast",
    calories: 250,
    protein: 25,
    carbohydrates: 50,
    fat: 10,
  };
  const lunchCandidates = [
    {
      ...verifiedMeal,
      id: "200-calorie-lunch",
      mealType: "lunch",
      calories: 200,
      protein: 20,
      carbohydrates: 40,
      fat: 8,
    },
    {
      ...verifiedMeal,
      id: "300-calorie-lunch",
      mealType: "lunch",
      calories: 300,
      protein: 30,
      carbohydrates: 60,
      fat: 12,
    },
  ];
  const result = recommendMeals({
    source: { meals: [breakfast, ...lunchCandidates] },
    calorieTarget: 1000,
    remainingCalories: 1000,
    remainingProtein: 100,
    remainingCarbohydrates: 200,
    remainingFat: 40,
  });

  assert.equal(result.meals[0].recommendation, breakfast);
  assert.equal(result.meals[1].recommendation, lunchCandidates[0]);
});

test("matches all four meal slots when each fits the remaining calorie and macro budgets", () => {
  const meals = ["breakfast", "lunch", "evening-snacks", "dinner"].map((mealType) => ({
    ...verifiedMeal,
    id: `250-calorie-${mealType}`,
    mealType,
    calories: 250,
    protein: 10,
    carbohydrates: 40,
    fat: 5,
  }));
  const result = recommendMeals({
    source: { meals },
    calorieTarget: 1000,
    remainingCalories: 1000,
    remainingProtein: 40,
    remainingCarbohydrates: 160,
    remainingFat: 20,
  });

  assert.equal(result.status, "ready");
  assert.deepEqual(result.meals.map((slot) => slot.recommendation?.mealType), [
    "breakfast",
    "lunch",
    "evening-snacks",
    "dinner",
  ]);
});

test("selects meal portions against remaining nutrition needs, not full-day targets", () => {
  const lowerProteinMeal = {
    ...verifiedMeal,
    id: "lower-protein",
    name: "Lower protein",
    calories: 350,
    protein: 10,
    carbohydrates: 80,
    fat: 30,
  };
  const balancedMeal = {
    ...verifiedMeal,
    id: "remaining-match",
    name: "Remaining match",
    calories: 300,
    protein: 35,
    carbohydrates: 20,
    fat: 8,
  };

  const result = recommendMeals({
    source: { meals: [lowerProteinMeal, balancedMeal] },
    calorieTarget: 2200,
    remainingCalories: 400,
    proteinTarget: 150,
    remainingProtein: 40,
    carbohydrateTarget: 250,
    remainingCarbohydrates: 20,
    fatTarget: 70,
    remainingFat: 10,
  });

  assert.equal(result.meals[0].recommendation, balancedMeal);
});

test("does not exceed remaining macronutrient budgets across recommendations", () => {
  const meals = ["breakfast", "lunch"].map((mealType) => ({
    ...verifiedMeal,
    id: `20g-protein-${mealType}`,
    mealType,
    calories: 300,
    protein: 20,
    carbohydrates: 30,
    fat: 8,
  }));
  const result = recommendMeals({
    source: { meals },
    calorieTarget: 1000,
    remainingCalories: 1000,
    remainingProtein: 25,
    remainingCarbohydrates: 100,
    remainingFat: 30,
  });
  const recommendedMeals = result.meals
    .map((slot) => slot.recommendation)
    .filter(Boolean);

  assert.equal(recommendedMeals.length, 1);
  assert.ok(recommendedMeals.reduce((total, meal) => total + meal.protein, 0) <= 25);
});

test("does not recommend a verified portion larger than the remaining calorie allowance", () => {
  const result = recommendMeals({
    source: { meals: [verifiedMeal] },
    calorieTarget: 2200,
    remainingCalories: 300,
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.meals[0].recommendation, null);
});

test("stops recommending meals after the daily calorie target is reached", () => {
  const result = recommendMeals({
    source: { meals: [verifiedMeal] },
    calorieTarget: 2200,
    remainingCalories: 0,
  });

  assert.equal(result.status, "unavailable");
  assert.match(result.reason, /target has been reached/);
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

test("honors matching dietary tags and selected food preferences", () => {
  const result = recommendMeals({
    source: { meals: [verifiedMeal] },
    calorieTarget: 2000,
    diets: ["Vegan"],
    preferences: ["oats"],
  });

  assert.equal(result.status, "ready");
  assert.equal(result.meals[0].recommendation, verifiedMeal);
});

test("excludes meals declaring a requested allergen", () => {
  const result = recommendMeals({
    source: { meals: [{ ...verifiedMeal, allergens: ["peanut"] }] },
    calorieTarget: 2000,
    allergies: ["Peanuts"],
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

test("fails closed when allergen information is missing for a user with allergies", () => {
  const meal = { ...verifiedMeal };
  delete meal.allergens;
  const result = recommendMeals({
    source: { meals: [meal] },
    calorieTarget: 2000,
    allergies: ["peanut"],
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.meals[0].recommendation, null);
});

test("rejects missing nutrition values and incomplete source references", () => {
  const invalidMeals = [
    { ...verifiedMeal, calories: undefined },
    { ...verifiedMeal, protein: undefined },
    { ...verifiedMeal, carbohydrates: undefined },
    { ...verifiedMeal, fat: undefined },
    { ...verifiedMeal, sourceName: "" },
    { ...verifiedMeal, sourceUrl: "" },
    { ...verifiedMeal, sourceUrl: "http://example.test/food" },
    { ...verifiedMeal, sourceUrl: "not a URL" },
  ];
  const result = recommendMeals({
    source: { meals: invalidMeals },
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
