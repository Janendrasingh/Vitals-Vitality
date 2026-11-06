import assert from "node:assert/strict";
import test from "node:test";
import { mealCatalog, createMealCatalog } from "../mealCatalog.js";
import { ingredients } from "./ingredients.js";
import { calculateMealNutrition, calculateRecipeNutrition } from "./nutritionCalculator.js";

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
      { ingredientId: "fixture-grain", quantityGrams: 100, preparationState: "dry", quantityBasis: "edible-portion", quantityPrecision: "exact", ingredientMatchStatus: "verified" },
      { ingredientId: "fixture-pulse", quantityGrams: 50, preparationState: "dry", quantityBasis: "edible-portion", quantityPrecision: "exact", ingredientMatchStatus: "verified" },
    ],
    servings: 2,
    servingDescription: "Synthetic test recipe, 2 servings",
    servingCountPrecision: "verified",
    cookingMethod: "Test fixture only; no real preparation is implied.",
    preparationInstructions: ["Test fixture only."],
    preparationAssumptions: ["Synthetic calculation fixture only."],
    sourceIngredients: ["fixture grain", "fixture pulse"],
    sourceIngredientCoverage: "complete",
    unmappedIngredients: [],
    dietaryTags: [],
    dietaryClassificationStatus: "verified",
    allergens: [],
    verificationStatus: "verified",
    nutritionCoverage: "complete",
    allergenInformationStatus: "complete",
    verificationEvidence: Object.fromEntries([
      "composition",
      "quantities",
      "preparation",
      "yield",
      "dietaryClassification",
      "allergens",
    ].map((key) => [key, {
      status: "verified",
      sourceReference: `fixture:${key}`,
      sourceUrl: "https://example.test/fixture/recipe-1",
    }])),
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

test("calculates an ad-hoc meal from ingredient weights and preserves optional nutrient gaps", () => {
  const ingredientsWithPartialCalcium = [
    { ...testOnlyIngredients[0], nutritionPer100g: { ...testOnlyIngredients[0].nutritionPer100g, calcium: 10 } },
    testOnlyIngredients[1],
  ];
  const result = calculateMealNutrition([
    { ingredientId: "fixture-grain", quantityGrams: 100 },
    { ingredientId: "fixture-pulse", quantityGrams: 50 },
  ], ingredientsWithPartialCalcium, { servings: 2 });

  assert.equal(result.available, true);
  assert.equal(result.verified, true);
  assert.equal(result.total.calories, 350);
  assert.equal(result.perServing.protein, 10);
  assert.equal(result.perServing.fibre, 5);
  assert.equal(result.perServing.calcium, null);
  assert.ok(result.warnings.some((warning) => /Optional nutrient totals are unavailable/.test(warning)));
});

test("rejects invalid ingredient quantities and unknown ingredients in ad-hoc meals", () => {
  for (const quantityGrams of [-1, null, "25", undefined]) {
    const result = calculateMealNutrition([
      { ingredientId: "fixture-grain", quantityGrams },
    ], testOnlyIngredients);
    assert.equal(result.available, false);
    assert.match(result.errors.join(" "), /non-negative quantity in grams/);
  }

  const missing = calculateMealNutrition([
    { ingredientId: "not-in-database", quantityGrams: 20 },
  ], testOnlyIngredients);
  assert.equal(missing.available, false);
  assert.match(missing.errors.join(" "), /missing from the ingredient database/);
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

test("keeps recipe calculations unverified when nutrition or allergen coverage is incomplete", () => {
  const result = calculateRecipeNutrition(fixtureRecipe({
    verificationStatus: "estimated",
    nutritionCoverage: "partial",
    allergenInformationStatus: "partial",
  }), testOnlyIngredients);

  assert.equal(result.available, true);
  assert.equal(result.verified, false);
  assert.ok(result.verificationReasons.some((reason) => /Nutrition coverage is not complete/.test(reason)));
  assert.ok(result.verificationReasons.some((reason) => /Allergen coverage is not complete/.test(reason)));
});

test("does not produce recommendation meals from an empty recipe database", () => {
  const catalog = createMealCatalog([], testOnlyIngredients);

  assert.equal(catalog.meals.length, 0);
  assert.equal(mealCatalog.meals.length, 0);
});

test("provides sourced, dynamically calculated recipe estimates without promoting partial data", () => {
  assert.ok(mealCatalog.recipes.length >= 8);
  assert.equal(mealCatalog.meals.length, 0);
  for (const recipe of mealCatalog.recipes) {
    assert.match(recipe.provenance.sourceUrl, /^https:\/\//);
    assert.ok(recipe.provenance.sourceReference);
    assert.equal(recipe.verificationStatus, "estimated");
    assert.equal(recipe.nutritionCoverage, "partial");
    assert.equal(recipe.allergenInformationStatus, "partial");
    assert.notEqual(recipe.servingCountPrecision, "verified");
    assert.equal(recipe.recommendable, false);
    assert.equal(recipe.nutrition.available, true, recipe.name);
    assert.equal(recipe.nutrition.verified, false, recipe.name);
    assert.ok(recipe.nutrition.perServing.calories > 0, recipe.name);
    assert.ok(recipe.unmappedIngredients.length > 0, recipe.name);
    assert.ok(recipe.instructions.length > 0, recipe.name);
    assert.ok(recipe.ingredients.every((item) => item.quantityGrams > 0), recipe.name);
    assert.equal(
      new Set(recipe.ingredients.map((item) => item.ingredientId)).size,
      recipe.ingredients.length,
      `${recipe.name} has duplicate mapped ingredients`
    );
    assert.ok(recipe.ingredients.every((item) => item.sourceQuantity && item.quantityPrecision), recipe.name);
  }
});

test("keeps recipes with missing ingredient data visible but without calculated nutrition", () => {
  const catalog = createMealCatalog([fixtureRecipe({
    ingredients: [{
      ingredientId: "missing-ingredient",
      quantityGrams: 50,
      preparationState: "dry",
      quantityBasis: "edible-portion",
    }],
  })], testOnlyIngredients);

  assert.equal(catalog.recipes.length, 1);
  assert.equal(catalog.recipes[0].nutrition.available, false);
  assert.match(catalog.recipes[0].nutrition.errors.join(" "), /missing from the ingredient database/);
  assert.equal(catalog.meals.length, 0);
});

test("requires complete nutrition and allergen coverage before catalog recommendations", () => {
  const completeRecipe = fixtureRecipe();
  const catalog = createMealCatalog([
    completeRecipe,
    { ...completeRecipe, id: "partial-allergens", allergenInformationStatus: "partial" },
    { ...completeRecipe, id: "partial-nutrition", nutritionCoverage: "partial" },
  ], testOnlyIngredients);

  assert.deepEqual(catalog.meals.map((meal) => meal.id), [completeRecipe.id]);
});

test("imports distinct source-cited food records without treating missing values as verified", () => {
  const ids = ingredients.map((ingredient) => ingredient.id);
  assert.equal(new Set(ids).size, ingredients.length);
  assert.ok(ingredients.length >= 50);
  assert.deepEqual(new Set(ingredients.map((ingredient) => ingredient.category)), new Set([
    "cereals-and-grains",
    "pulses-and-legumes",
    "dairy-products",
    "vegetables",
    "fruits",
    "nuts-and-seeds",
    "oils-and-fats",
    "spices",
  ]));
  for (const ingredient of ingredients) {
    assert.ok(ingredient.source.sourceReference);
    assert.match(ingredient.source.sourceUrl, /^https:\/\//);
    if (ingredient.source.sourceRecordId) {
      assert.equal(ingredient.source.datasetVersion !== undefined, true);
    }
    const complete = ["calories", "protein", "carbohydrates", "fat", "fibre"]
      .every((key) => Number.isFinite(ingredient.nutritionPer100g[key]));
    assert.equal(ingredient.verificationStatus === "verified", complete);
  }
});
