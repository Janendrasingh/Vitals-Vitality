import assert from "node:assert/strict";
import test from "node:test";
import { mealCatalog, createMealCatalog } from "../mealCatalog.js";
import { calculateRecipeNutrition } from "./nutritionCalculator.js";

// Synthetic test-only numbers validate arithmetic; they are not food data.
const testOnlyIngredients = [
  {
    id: "fixture-grain",
    name: "Test-only grain fixture",
    category: "cereals-and-grains",
    preparationState: "dry",
    quantityBasis: "edible-portion",
    nutritionPer100g: { calories: 200, protein: 10, carbohydrates: 40, fat: 4, fibre: 5 },
    source: {
      sourceName: "Synthetic test fixture",
      sourceReference: "fixture:grain-1",
      sourceUrl: "https://example.test/fixture/grain-1",
    },
    verificationStatus: "verified",
  },
  {
    id: "fixture-pulse",
    name: "Test-only pulse fixture",
    category: "pulses-and-legumes",
    preparationState: "dry",
    quantityBasis: "edible-portion",
    nutritionPer100g: { calories: 300, protein: 20, carbohydrates: 50, fat: 2, fibre: 10 },
    source: {
      sourceName: "Synthetic test fixture",
      sourceReference: "fixture:pulse-1",
      sourceUrl: "https://example.test/fixture/pulse-1",
    },
    verificationStatus: "verified",
  },
];

function fixtureRecipe(overrides = {}) {
  return {
    id: "fixture-recipe",
    name: "Test-only recipe fixture",
    mealCategory: "lunch",
    ingredients: [
      { ingredientId: "fixture-grain", quantityGrams: 100, preparationState: "dry", quantityBasis: "edible-portion" },
      { ingredientId: "fixture-pulse", quantityGrams: 50, preparationState: "dry", quantityBasis: "edible-portion" },
    ],
    servings: 2,
    servingDescription: "Synthetic test recipe, 2 servings",
    cookingMethod: "Test fixture only; no real preparation is implied.",
    preparationAssumptions: ["Synthetic calculation fixture only."],
    dietaryTags: [],
    allergens: [],
    verificationStatus: "verified",
    provenance: {
      sourceName: "Synthetic test fixture",
      sourceReference: "fixture:recipe-1",
      sourceUrl: "https://example.test/fixture/recipe-1",
    },
    ...overrides,
  };
}

test("calculates ingredient contributions and totals across multiple ingredients", () => {
  const result = calculateRecipeNutrition(fixtureRecipe(), testOnlyIngredients);

  assert.equal(result.available, true);
  assert.equal(result.verified, true);
  assert.deepEqual(result.total, {
    calories: 350,
    protein: 20,
    carbohydrates: 65,
    fat: 5,
    fibre: 10,
  });
  assert.deepEqual(result.perServing, {
    calories: 175,
    protein: 10,
    carbohydrates: 32.5,
    fat: 2.5,
    fibre: 5,
  });
});

test("uses ingredient quantities in grams and supports overriding serving count", () => {
  const recipe = fixtureRecipe({
    ingredients: [
      { ingredientId: "fixture-grain", quantityGrams: 25, preparationState: "dry", quantityBasis: "edible-portion" },
    ],
  });
  const result = calculateRecipeNutrition(recipe, testOnlyIngredients, { servings: 5 });

  assert.equal(result.total.calories, 50);
  assert.equal(result.total.protein, 2.5);
  assert.equal(result.perServing.calories, 10);
  assert.equal(result.perServing.fibre, 0.25);
});

test("reports missing ingredient IDs instead of substituting zero", () => {
  const result = calculateRecipeNutrition(fixtureRecipe({
    ingredients: [{ ingredientId: "not-in-database", quantityGrams: 20, preparationState: "dry", quantityBasis: "edible-portion" }],
  }), testOnlyIngredients);

  assert.equal(result.available, false);
  assert.equal(result.total, null);
  assert.match(result.errors.join(" "), /missing from the ingredient database/);
});

test("rejects incomplete ingredient nutrient records", () => {
  const incompleteIngredients = [{
    ...testOnlyIngredients[0],
    nutritionPer100g: { calories: 100, protein: 2, carbohydrates: 10, fat: 1 },
  }];
  const result = calculateRecipeNutrition(fixtureRecipe({
    ingredients: [{ ingredientId: "fixture-grain", quantityGrams: 50, preparationState: "dry", quantityBasis: "edible-portion" }],
  }), incompleteIngredients);

  assert.equal(result.available, false);
  assert.match(result.errors.join(" "), /fibre/);
});

test("rejects negative, missing, and non-numeric ingredient quantities", () => {
  for (const quantityGrams of [-1, null, "25", undefined]) {
    const result = calculateRecipeNutrition(fixtureRecipe({
      ingredients: [{ ingredientId: "fixture-grain", quantityGrams, preparationState: "dry", quantityBasis: "edible-portion" }],
    }), testOnlyIngredients);
    assert.equal(result.available, false);
    assert.match(result.errors.join(" "), /non-negative quantity in grams/);
  }
});

test("accepts an explicitly specified zero-gram contribution without treating missing nutrition as zero", () => {
  const result = calculateRecipeNutrition(fixtureRecipe({
    ingredients: [{ ingredientId: "fixture-grain", quantityGrams: 0, preparationState: "dry", quantityBasis: "edible-portion" }],
  }), testOnlyIngredients);

  assert.equal(result.available, true);
  assert.equal(result.total.calories, 0);
  assert.equal(result.total.fibre, 0);
});

test("rejects invalid recipes and missing or invalid serving counts", () => {
  assert.equal(calculateRecipeNutrition(null, testOnlyIngredients).available, false);
  for (const servings of [null, 0, -1, "two"]) {
    const result = calculateRecipeNutrition(fixtureRecipe({ servings }), testOnlyIngredients);
    assert.equal(result.available, false);
    assert.match(result.errors.join(" "), /servings must be a positive number/);
  }
  const invalid = calculateRecipeNutrition(fixtureRecipe({ mealCategory: "brunch" }), testOnlyIngredients);
  assert.match(invalid.errors.join(" "), /unsupported meal category/);
});

test("rejects raw-versus-cooked preparation state mismatches", () => {
  const result = calculateRecipeNutrition(fixtureRecipe({
    ingredients: [{ ingredientId: "fixture-grain", quantityGrams: 50, preparationState: "cooked", quantityBasis: "edible-portion" }],
  }), testOnlyIngredients);

  assert.equal(result.available, false);
  assert.match(result.errors.join(" "), /preparation state does not match/);
});

test("rejects an ingredient quantity basis that differs from its nutrition record", () => {
  const result = calculateRecipeNutrition(fixtureRecipe({
    ingredients: [{
      ingredientId: "fixture-grain",
      quantityGrams: 50,
      preparationState: "dry",
      quantityBasis: "as-purchased",
    }],
  }), testOnlyIngredients);

  assert.equal(result.available, false);
  assert.match(result.errors.join(" "), /quantity basis does not match/);
});

test("requires exact ingredient and recipe source references", () => {
  const missingIngredientSource = [{
    ...testOnlyIngredients[0],
    source: { sourceName: "Synthetic fixture", sourceReference: "", sourceUrl: "" },
  }];
  const ingredientResult = calculateRecipeNutrition(fixtureRecipe({
    ingredients: [{ ingredientId: "fixture-grain", quantityGrams: 50, preparationState: "dry", quantityBasis: "edible-portion" }],
  }), missingIngredientSource);
  assert.match(ingredientResult.errors.join(" "), /exact reference, and HTTPS source URL/);

  const recipeResult = calculateRecipeNutrition(fixtureRecipe({
    provenance: { sourceName: "Synthetic fixture", sourceReference: "", sourceUrl: "" },
  }), testOnlyIngredients);
  assert.match(recipeResult.errors.join(" "), /Recipe provenance must include/);
});

test("calculates but does not mark unverified ingredient data as verified", () => {
  const unverifiedIngredients = testOnlyIngredients.map((ingredient) => ({
    ...ingredient,
    verificationStatus: "unverified",
  }));
  const result = calculateRecipeNutrition(fixtureRecipe(), unverifiedIngredients);

  assert.equal(result.available, true);
  assert.equal(result.verified, false);
  assert.ok(result.warnings.some((warning) => /not verified/.test(warning)));
});

test("does not produce recommendation meals from an empty recipe database", () => {
  const catalog = createMealCatalog([], testOnlyIngredients);

  assert.equal(catalog.meals.length, 0);
  assert.equal(mealCatalog.meals.length, 0);
});
