import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MEAL_DISTRIBUTION,
  generateDailyMealPlan,
  replaceDailyMealPlanItem,
} from "./dailyMealPlan.js";
import { mealCatalog } from "./mealCatalog.js";

const targets = {
  available: true,
  error: null,
  calorieTarget: 2200,
  proteinTarget: 150,
  carbohydrateTarget: 250,
  fatTarget: 70,
};

function verifiedMeal(id, mealType, overrides = {}) {
  return {
    id,
    name: id,
    mealType,
    portionSize: "1 serving",
    calories: 300,
    protein: 20,
    carbohydrates: 40,
    fat: 10,
    fiber: 5,
    ingredients: [{ name: "oats" }],
    allergens: [],
    tags: ["vegan", "vegetarian"],
    sourceName: "Test recipe source",
    sourceUrl: "https://example.test/recipe",
    verificationStatus: "verified",
    nutritionCoverage: "complete",
    nutritionComplete: true,
    allergenInformationStatus: "complete",
    ...overrides,
  };
}

function fiveSlotMeals() {
  return [
    verifiedMeal("breakfast", "breakfast", { calories: 400 }),
    verifiedMeal("morning-snack", "evening-snacks", { calories: 150 }),
    verifiedMeal("lunch", "lunch", { calories: 500 }),
    verifiedMeal("evening-snack", "evening-snacks", { calories: 150 }),
    verifiedMeal("dinner", "dinner", { calories: 500 }),
  ];
}

test("generates five personalized meal slots from verified recipe nutrition", () => {
  const plan = generateDailyMealPlan({
    source: { meals: fiveSlotMeals() },
    targets,
  });

  assert.equal(plan.status, "ready");
  assert.equal(plan.filledSlots, 5);
  assert.deepEqual(plan.slots.map((slot) => slot.label), [
    "Breakfast",
    "Mid-morning snack",
    "Lunch",
    "Evening snack",
    "Dinner",
  ]);
  assert.equal(plan.planTotals.calories, 1700);
  assert.equal(plan.planTotals.protein, 100);
  assert.equal(plan.planTotals.carbohydrates, 200);
  assert.equal(plan.planTotals.fat, 50);
  assert.equal(plan.dailyBalance.remaining.calories, 500);
  assert.equal(plan.dailyBalance.remaining.protein, 50);
});

test("uses configurable calorie shares when ranking meal portions", () => {
  const meals = [
    verifiedMeal("breakfast-300", "breakfast", { calories: 300 }),
    verifiedMeal("breakfast-700", "breakfast", { calories: 700 }),
    ...fiveSlotMeals().filter((meal) => meal.mealType !== "breakfast"),
  ];
  const distribution = {
    ...DEFAULT_MEAL_DISTRIBUTION,
    breakfast: 40,
    midMorningSnack: 5,
    lunch: 25,
    eveningSnack: 5,
    dinner: 25,
  };
  const plan = generateDailyMealPlan({
    source: { meals },
    targets,
    distribution,
  });

  assert.equal(plan.status, "ready");
  assert.equal(plan.distribution.breakfast, 40);
  assert.equal(plan.slots[0].recommendation.id, "breakfast-700");
});

test("filters candidates for declared allergies and dietary restrictions", () => {
  const allergyConflict = verifiedMeal("peanut-recipe", "breakfast", {
    allergens: ["peanut"],
    ingredients: [{ name: "peanuts" }],
  });
  const nonVegan = verifiedMeal("non-vegan", "breakfast", {
    tags: ["vegetarian"],
  });
  const suitable = verifiedMeal("safe-vegan", "breakfast");
  const plan = generateDailyMealPlan({
    source: { meals: [allergyConflict, nonVegan, suitable] },
    targets,
    allergies: ["Peanuts"],
    diets: ["Vegan"],
  });

  assert.equal(plan.slots[0].recommendation.id, "safe-vegan");
});

test("does not repeat a meal across plan slots and excludes meals already consumed", () => {
  const consumed = verifiedMeal("already-eaten", "breakfast");
  const loggedMeals = [{
    id: "logged-breakfast",
    name: consumed.name,
    calories: 300,
    protein: 20,
    carbs: 40,
    fat: 10,
  }];
  const repeatedBreakfast = verifiedMeal("another-breakfast", "breakfast");
  const plan = generateDailyMealPlan({
    source: { meals: [consumed, repeatedBreakfast] },
    targets,
    loggedMeals,
  });
  const recommendations = plan.slots.map((slot) => slot.recommendation).filter(Boolean);

  assert.equal(plan.slots[0].recommendation.id, repeatedBreakfast.id);
  assert.equal(recommendations.length, 1);
  assert.equal(new Set(recommendations.map((meal) => meal.id)).size, recommendations.length);
});

test("uses a single snack recipe only once across the two snack slots", () => {
  const snack = verifiedMeal("one-snack", "evening-snacks");
  const plan = generateDailyMealPlan({
    source: { meals: [snack] },
    targets,
  });
  const selectedSnacks = plan.slots
    .filter((slot) => slot.id.includes("snack"))
    .map((slot) => slot.recommendation)
    .filter(Boolean);

  assert.equal(selectedSnacks.length, 1);
  assert.equal(selectedSnacks[0].id, snack.id);
  assert.equal(plan.status, "partial");
});

test("reports a partial plan when verified options are insufficient", () => {
  const plan = generateDailyMealPlan({
    source: { meals: [verifiedMeal("only-breakfast", "breakfast")] },
    targets,
  });

  assert.equal(plan.status, "partial");
  assert.equal(plan.filledSlots, 1);
  assert.match(plan.reason, /Only 1 of 5 meal slots/);
});

test("replaces a planned meal without changing logged history or duplicating another slot", () => {
  const loggedMeals = [{
    id: "logged",
    name: "logged snack",
    calories: 100,
    protein: 5,
    carbs: 10,
    fat: 3,
  }];
  const meals = [
    verifiedMeal("breakfast-one", "breakfast", { calories: 200 }),
    verifiedMeal("breakfast-two", "breakfast", { calories: 220 }),
    ...fiveSlotMeals().filter((meal) => meal.mealType !== "breakfast"),
  ];
  const source = { meals };
  const plan = generateDailyMealPlan({ source, targets, loggedMeals });
  const historyBefore = structuredClone(loggedMeals);
  const updated = replaceDailyMealPlanItem({
    plan,
    slotId: "breakfast",
    source,
    targets,
    loggedMeals,
  });

  assert.equal(updated.replacementError, null);
  assert.equal(updated.slots[0].recommendation.id, "breakfast-one");
  assert.equal(updated.planTotals.calories, plan.planTotals.calories - 20);
  assert.deepEqual(loggedMeals, historyBefore);
  const planIds = updated.slots.map((slot) => slot.recommendation?.id).filter(Boolean);
  assert.equal(new Set(planIds).size, planIds.length);
});

test("does not replace a planned meal with a previously consumed recipe", () => {
  const loggedMeals = [{
    id: "history-id",
    name: "consumed alternative",
    calories: 100,
    protein: 5,
    carbs: 10,
    fat: 3,
  }];
  const source = {
    meals: [
      verifiedMeal("current", "breakfast"),
      verifiedMeal("consumed-alternative", "breakfast", { name: "consumed alternative" }),
    ],
  };
  const plan = generateDailyMealPlan({ source, targets, loggedMeals });
  const updated = replaceDailyMealPlanItem({
    plan,
    slotId: "breakfast",
    source,
    targets,
    loggedMeals,
  });

  assert.ok(updated.replacementError);
  assert.equal(updated.slots[0].recommendation.id, "current");
});

test("keeps unavailable nutrition and incomplete recipes out of the plan", () => {
  const missingNutrition = verifiedMeal("missing-nutrition", "breakfast", { protein: null });
  const estimatedRecipe = verifiedMeal("estimated", "breakfast", {
    verificationStatus: "estimated",
  });
  const plan = generateDailyMealPlan({
    source: { meals: [missingNutrition, estimatedRecipe] },
    targets,
  });

  assert.equal(plan.status, "unavailable");
  assert.equal(plan.filledSlots, 0);
  assert.equal(plan.planTotals.calories, null);
  assert.equal(plan.dailyBalance.remaining.calories, targets.calorieTarget);
  assert.match(plan.reason, /verified/i);
});

test("reports a meaningful empty plan when no eligible verified recipes exist", () => {
  const plan = generateDailyMealPlan({
    source: {
      meals: [],
      unavailableReason: "No complete, verified recipe nutrition and allergen records are configured.",
    },
    targets,
  });

  assert.equal(plan.status, "unavailable");
  assert.equal(plan.filledSlots, 0);
  assert.match(plan.reason, /verified recipe nutrition/);
  assert.equal(plan.slots.length, 5);
  assert.ok(plan.slots.every((slot) => slot.recommendation === null));
});

test("keeps the existing recipe catalog excluded while no recipe is verified", () => {
  const plan = generateDailyMealPlan({
    source: mealCatalog,
    targets,
  });

  assert.equal(mealCatalog.recipes.length, 9);
  assert.equal(mealCatalog.meals.length, 0);
  assert.ok(mealCatalog.recipes
    .filter(({ id }) => ["masoor-dal", "paneer-bhurji"].includes(id))
    .every((recipe) => recipe.recommendable === false));
  assert.equal(plan.status, "unavailable");
  assert.equal(plan.filledSlots, 0);
  assert.ok(plan.slots.every((slot) => slot.recommendation === null));
});

test("rejects unavailable profile targets and invalid calorie distributions", () => {
  const missingProfile = generateDailyMealPlan({
    source: { meals: fiveSlotMeals() },
    targets: { available: false, error: "Complete your profile." },
  });
  const invalidDistribution = generateDailyMealPlan({
    source: { meals: fiveSlotMeals() },
    targets,
    distribution: { ...DEFAULT_MEAL_DISTRIBUTION, dinner: 20 },
  });
  const zeroShareDistribution = generateDailyMealPlan({
    source: { meals: fiveSlotMeals() },
    targets,
    distribution: { ...DEFAULT_MEAL_DISTRIBUTION, breakfast: 0 },
  });

  assert.equal(missingProfile.status, "unavailable");
  assert.match(missingProfile.reason, /Complete your profile/);
  assert.equal(invalidDistribution.status, "unavailable");
  assert.match(invalidDistribution.reason, /add up to 100/);
  assert.equal(zeroShareDistribution.status, "unavailable");
});

test("keeps the plan unavailable when logged nutrition is incomplete", () => {
  const plan = generateDailyMealPlan({
    source: { meals: fiveSlotMeals() },
    targets,
    loggedMeals: [{ name: "unknown meal", calories: 300, protein: null, carbs: 40, fat: 10 }],
  });

  assert.equal(plan.status, "unavailable");
  assert.equal(plan.slots.every((slot) => slot.recommendation === null), true);
  assert.equal(plan.dailyBalance.remaining.protein, null);
});
