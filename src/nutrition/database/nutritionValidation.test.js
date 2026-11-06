import assert from "node:assert/strict";
import test from "node:test";
import { ingredients } from "./ingredients.js";
import { recipes } from "./recipes.js";
import { calculateMealNutrition } from "./nutritionCalculator.js";
import {
  evaluateRecipeVerification,
  validateIngredientRecords,
  validateRecipeDatabase,
  validateRecipeRecord,
} from "./nutritionValidation.js";

const source = {
  sourceName: "Synthetic fixture",
  sourceReference: "fixture:food",
  sourceUrl: "https://example.test/fixture/food",
};

const fixtureIngredient = {
  id: "fixture-food",
  name: "Synthetic fixture food",
  category: "pulses-and-legumes",
  preparationState: "dry",
  quantityBasis: "edible-portion",
  nutritionPer100g: { calories: 100, protein: 5, carbohydrates: 20, fat: 1, fibre: 4 },
  nutritionUnits: { calories: "kcal", protein: "g", carbohydrates: "g", fat: "g", fibre: "g" },
  missingRequiredNutrients: [],
  source,
  verificationStatus: "verified",
};

function verificationEvidence() {
  return Object.fromEntries([
    "composition",
    "quantities",
    "preparation",
    "yield",
    "dietaryClassification",
    "allergens",
  ].map((key) => [key, {
    status: "verified",
    sourceReference: `fixture:${key}`,
    sourceUrl: "https://example.test/fixture/recipe",
  }]));
}

function completeRecipe(overrides = {}) {
  return {
    id: "fixture-recipe",
    name: "Synthetic fixture recipe",
    mealCategory: "lunch",
    ingredients: [{
      ingredientId: fixtureIngredient.id,
      quantityGrams: 50,
      preparationState: fixtureIngredient.preparationState,
      quantityBasis: fixtureIngredient.quantityBasis,
      quantityPrecision: "exact",
      ingredientMatchStatus: "verified",
    }],
    servings: 1,
    servingDescription: "1 source-verified portion",
    servingCountPrecision: "verified",
    cookingMethod: "Synthetic fixture only.",
    preparationInstructions: ["Synthetic fixture only."],
    preparationAssumptions: ["Synthetic test data."],
    sourceIngredients: ["50 g fixture food"],
    sourceIngredientCoverage: "complete",
    unmappedIngredients: [],
    dietaryTags: ["vegetarian"],
    dietaryClassificationStatus: "verified",
    allergens: [],
    allergenInformationStatus: "complete",
    nutritionCoverage: "complete",
    verificationStatus: "verified",
    verificationEvidence: verificationEvidence(),
    provenance: {
      sourceName: "Synthetic fixture",
      sourceReference: "fixture:recipe",
      sourceUrl: "https://example.test/fixture/recipe",
    },
    ...overrides,
  };
}

test("validates the current source-cited ingredient database", () => {
  const result = validateIngredientRecords(ingredients);

  assert.equal(result.valid, true, result.errors.join(" "));
  assert.equal(ingredients.length, 73);
  assert.equal(new Set(ingredients.map(({ id }) => id)).size, ingredients.length);
  assert.ok(ingredients.every((ingredient) =>
    Object.keys(ingredient.nutritionPer100g).every((key) =>
      ingredient.nutritionUnits[key] !== undefined
    )
  ));
});

test("adds source-cited USDA spice records without claiming recipe-form matches", () => {
  const expected = new Map([
    ["cardamom-dried", ["170919", 311, 28]],
    ["cinnamon-ground", ["171320", 247, 53.1]],
    ["cloves-ground", ["171321", 274, 33.9]],
    ["fenugreek-seeds-dried", ["171324", 323, 24.6]],
  ]);
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const [id, [fdcId, calories, fibre]] of expected) {
    const ingredient = ingredientById.get(id);
    assert.ok(ingredient, `${id} exists`);
    assert.equal(ingredient.nutritionPer100g.calories, calories);
    assert.equal(ingredient.nutritionPer100g.fibre, fibre);
    assert.ok(ingredient.source.sourceReference.includes(`FDC food ID ${fdcId}:`));
    assert.equal(ingredient.verificationStatus, "verified");
    const calculation = calculateMealNutrition([
      { ingredientId: id, quantityGrams: 100 },
    ], ingredients, { servings: 2 });
    assert.equal(calculation.available, true);
    assert.equal(calculation.perServing.calories, calories / 2);
  }

  assert.equal(recipes.some((recipe) =>
    recipe.ingredients.some((item) => expected.has(item.ingredientId))
  ), false);
  assert.ok(recipes.find(({ id }) => id === "palak-paneer").unmappedIngredients.includes("cinnamon"));
  assert.ok(recipes.find(({ id }) => id === "palak-paneer").unmappedIngredients.includes("cloves"));
  assert.ok(recipes.find(({ id }) => id === "matar-paneer").unmappedIngredients.includes("kasuri methi"));
});

test("records original ingredient lists and yields for eight recipe sources without verifying recipe completeness", () => {
  const reviewedIds = [
    "masoor-dal",
    "chana-masala",
    "rajma-masala",
    "aloo-gobi",
    "vegetable-upma",
    "paneer-bhurji",
    "palak-paneer",
    "matar-paneer",
  ];
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const expectedYields = new Map([
    ["masoor-dal", [2.5, "estimated"]],
    ["chana-masala", [4, "source-stated"]],
    ["rajma-masala", [4, "source-stated"]],
    ["aloo-gobi", [3, "source-stated"]],
    ["vegetable-upma", [2.5, "estimated"]],
    ["paneer-bhurji", [4, "source-stated"]],
    ["palak-paneer", [2.5, "estimated"]],
    ["matar-paneer", [4, "source-stated"]],
  ]);

  for (const id of reviewedIds) {
    const recipe = recipeById.get(id);
    const [yieldCount, yieldPrecision] = expectedYields.get(id);
    assert.ok(recipe.sourceIngredients.length > 10, `${id} retains its source ingredient list`);
    assert.equal(recipe.sourceIngredientCoverage, "source-listed");
    assert.equal(recipe.allergenInformationStatus, "partial");
    assert.equal(recipe.servings, yieldCount);
    assert.equal(recipe.servingCountPrecision, yieldPrecision);
    assert.equal(recipe.dietaryClassificationStatus, "provisional");
    assert.equal(evaluateRecipeVerification(recipe, ingredients).eligible, false);
  }

  const upmaIngredients = recipeById.get("vegetable-upma").sourceIngredients.join(" ").toLowerCase();
  for (const sourceItem of ["urad dal", "chana dal", "curry leaves", "asafoetida", "cashews"]) {
    assert.ok(upmaIngredients.includes(sourceItem), `source upma list includes ${sourceItem}`);
  }
  const unchecked = recipeById.get("coconut-milk-pulao");
  assert.equal(unchecked.sourceIngredients.length, 0);
  assert.equal(unchecked.provenance.status, "source-not-checked");
  assert.equal(evaluateRecipeVerification(unchecked, ingredients).eligible, false);
});

test("reconciles pilot recipe ingredient coverage without treating approximate mappings as exact", () => {
  const expected = new Map([
    ["masoor-dal", {
      sourceIngredients: 18,
      mapped: 9,
      unmapped: 9,
      exact: 1,
      approximate: 8,
      missingMappedQuantities: 0,
      sourceUrl: "https://www.indianhealthyrecipes.com/masoor-dal-recipe/",
    }],
    ["paneer-bhurji", {
      sourceIngredients: 15,
      mapped: 9,
      unmapped: 6,
      exact: 1,
      approximate: 8,
      missingMappedQuantities: 0,
      sourceUrl: "https://www.indianhealthyrecipes.com/paneer-bhurji-recipe/",
    }],
  ]);
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const [id, counts] of expected) {
    const recipe = recipeById.get(id);
    const exactCount = recipe.ingredients.filter((item) => item.quantityPrecision === "exact").length;
    const approximateCount = recipe.ingredients.filter((item) => item.quantityPrecision !== "exact").length;
    const missingMappedQuantities = recipe.ingredients.filter((item) =>
      !Number.isFinite(item.quantityGrams)
    ).length;

    assert.equal(recipe.sourceIngredients.length, counts.sourceIngredients);
    assert.equal(recipe.ingredients.length, counts.mapped);
    assert.equal(recipe.unmappedIngredients.length, counts.unmapped);
    assert.equal(recipe.sourceIngredients.length, recipe.ingredients.length + recipe.unmappedIngredients.length);
    assert.equal(exactCount, counts.exact);
    assert.equal(approximateCount, counts.approximate);
    assert.equal(missingMappedQuantities, counts.missingMappedQuantities);
    assert.equal(recipe.provenance.sourceUrl, counts.sourceUrl);
    assert.equal(recipe.sourceIngredientCoverage, "source-listed");

    for (const item of recipe.ingredients) {
      const ingredient = ingredientById.get(item.ingredientId);
      assert.ok(ingredient, `${id} mapping ${item.ingredientId} has a nutrition record`);
      assert.ok(ingredient.source.sourceReference);
      assert.ok(ingredient.source.sourceUrl.startsWith("https://"));
      assert.equal(item.ingredientMatchStatus, "unverified");
    }
  }

  const masoor = recipeById.get("masoor-dal");
  assert.ok(masoor.ingredients.some((item) => item.ingredientId === "red-lentils"));
  assert.ok(masoor.unmappedIngredients.some((name) => /moong dal/i.test(name)));
  assert.ok(!masoor.ingredients.some((item) => item.ingredientId === "mung-beans"));
  assert.ok(!masoor.ingredients.some((item) => item.ingredientId === "coriander-seeds"));

  const paneerBhurji = recipeById.get("paneer-bhurji");
  assert.ok(paneerBhurji.ingredients.some((item) => item.ingredientId === "paneer"));
  assert.ok(paneerBhurji.unmappedIngredients.includes("ginger garlic paste"));
  assert.ok(ingredientById.get("paneer").source.sourceReference.includes("FDC food ID 2705740"));
});

test("keeps different pulse, herb, and spice identities distinct", () => {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const allMappedIds = new Set(recipes.flatMap((recipe) =>
    recipe.ingredients.map((item) => item.ingredientId)
  ));

  assert.equal(ingredientById.get("red-lentils").name, "Red lentils");
  assert.ok(recipeById.get("masoor-dal").unmappedIngredients.some((name) => /moong dal/i.test(name)));
  assert.ok(!allMappedIds.has("mung-beans"));
  assert.ok(recipeById.get("vegetable-upma").unmappedIngredients.includes("urad dal"));
  assert.ok(recipeById.get("vegetable-upma").unmappedIngredients.includes("chana dal"));
  assert.ok(recipeById.get("masoor-dal").unmappedIngredients.includes("kasuri methi"));
  for (const id of ["chana-masala", "rajma-masala"]) {
    const recipe = recipeById.get(id);
    assert.ok(recipe.unmappedIngredients.includes("ginger garlic paste"));
    assert.ok(!recipe.ingredients.some((item) =>
      ["ginger", "garlic"].includes(item.ingredientId)
    ));
  }
  for (const recipe of recipes.filter((item) =>
    item.unmappedIngredients.some((name) => /kasuri methi/i.test(name))
  )) {
    assert.ok(!recipe.ingredients.some((item) => item.ingredientId === "fenugreek-seeds-dried"));
  }
  assert.ok(allMappedIds.has("coriander-leaves-raw"));
  assert.ok(!allMappedIds.has("coriander-seeds"));
  assert.equal(ingredientById.get("mustard-seeds").name, "Ground mustard seeds");
});

test("keeps pilot recipes ineligible when allergen evidence or source mappings are incomplete", () => {
  for (const id of ["masoor-dal", "paneer-bhurji"]) {
    const recipe = recipes.find((item) => item.id === id);
    const result = evaluateRecipeVerification(recipe, ingredients);

    assert.equal(recipe.verificationStatus, "estimated");
    assert.equal(recipe.allergenInformationStatus, "partial");
    assert.equal(recipe.nutritionCoverage, "partial");
    assert.equal(result.eligible, false);
    assert.ok(result.reasons.includes("Allergen coverage is not complete."));
    assert.ok(result.reasons.includes("Source ingredient coverage is not verified as complete."));
    assert.ok(result.reasons.includes("One or more source ingredients are unmapped."));
  }
});

test("does not calculate pilot recipe nutrition when a required source nutrient is missing", () => {
  const masoor = recipes.find((recipe) => recipe.id === "masoor-dal");
  const incompleteIngredients = ingredients.map((ingredient) =>
    ingredient.id === "red-lentils"
      ? {
        ...ingredient,
        nutritionPer100g: { ...ingredient.nutritionPer100g, fibre: null },
      }
      : ingredient
  );
  const result = calculateMealNutrition(masoor.ingredients, incompleteIngredients, {
    servings: masoor.servings,
  });

  assert.equal(result.available, false);
  assert.equal(result.perServing, null);
  assert.ok(result.errors.some((error) => /missing or invalid nutrient values: fibre/.test(error)));
});

test("keeps recipe allergens incomplete when source alternatives and cross-contact are unresolved", () => {
  for (const recipe of recipes) {
    assert.equal(recipe.allergenInformationStatus, "partial", recipe.id);
    assert.equal(evaluateRecipeVerification(recipe, ingredients).eligible, false, recipe.id);
  }
  assert.ok(recipes.find(({ id }) => id === "vegetable-upma").allergens.includes("gluten"));
});

test("reports duplicate IDs, duplicate names, and missing required nutrition", () => {
  const incomplete = {
    ...fixtureIngredient,
    id: "fixture-incomplete",
    nutritionPer100g: { calories: 1, protein: 2, carbohydrates: 3, fat: 4, fibre: null },
    missingRequiredNutrients: ["fibre"],
    verificationStatus: "unverified",
  };
  const result = validateIngredientRecords([
    fixtureIngredient,
    { ...fixtureIngredient },
    { ...incomplete, id: "fixture-incomplete-2" },
  ]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /ID .* duplicated/.test(error)));
  assert.ok(result.errors.some((error) => /name .* duplicated/.test(error)));
  assert.ok(result.warnings.some((warning) => /missing required nutrients: fibre/.test(warning)));
});

test("rejects missing, invalid, and unsupported nutrient units", () => {
  const missingUnits = validateIngredientRecords([{
    ...fixtureIngredient,
    nutritionUnits: undefined,
  }]);
  const invalidUnit = validateIngredientRecords([{
    ...fixtureIngredient,
    nutritionUnits: { ...fixtureIngredient.nutritionUnits, calories: "kJ" },
  }]);
  const unsupportedNutrient = validateIngredientRecords([{
    ...fixtureIngredient,
    nutritionPer100g: { ...fixtureIngredient.nutritionPer100g, energyKj: 100 },
    nutritionUnits: { ...fixtureIngredient.nutritionUnits, energyKj: "kJ" },
  }]);

  assert.ok(missingUnits.errors.some((error) => /missing nutrient units/.test(error)));
  assert.ok(invalidUnit.errors.some((error) => /invalid unit for calories; expected "kcal"/.test(error)));
  assert.ok(unsupportedNutrient.errors.some((error) => /unsupported nutrient key "energyKj"/.test(error)));
});

test("rejects source, invalid nutrient values, and false verified status", () => {
  const result = validateIngredientRecords([{
    ...fixtureIngredient,
    nutritionPer100g: { ...fixtureIngredient.nutritionPer100g, calcium: -1, fibre: null },
    missingRequiredNutrients: ["fibre"],
    source: { sourceName: "Missing citation", sourceReference: "", sourceUrl: "http://example.test" },
  }]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /invalid calcium/.test(error)));
  assert.ok(result.errors.some((error) => /cannot be verified with missing required nutrients/.test(error)));
  assert.ok(result.errors.some((error) => /source name, exact reference, and HTTPS URL/.test(error)));
});

test("validates recipe IDs, uniqueness, quantities, preparation states, and source records", () => {
  const invalid = completeRecipe({
    ingredients: [
      {
        ingredientId: fixtureIngredient.id,
        quantityGrams: 0,
        preparationState: "cooked",
        quantityBasis: "edible-portion",
      },
      {
        ingredientId: fixtureIngredient.id,
        quantityGrams: -1,
        preparationState: "dry",
        quantityBasis: "edible-portion",
      },
    ],
    provenance: { sourceName: "No URL", sourceReference: "fixture", sourceUrl: "http://example.test" },
  });
  const result = validateRecipeRecord(invalid, [fixtureIngredient]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /duplicated/.test(error)));
  assert.ok(result.errors.some((error) => /positive quantity/.test(error)));
  assert.ok(result.errors.some((error) => /preparation state does not match/.test(error)));
  assert.ok(result.errors.some((error) => /HTTPS URL/.test(error)));
});

test("rejects recipes with absent ingredients or invalid serving counts", () => {
  const missing = validateRecipeRecord(completeRecipe({
    ingredients: [{
      ingredientId: "absent",
      quantityGrams: 1,
      preparationState: "dry",
      quantityBasis: "edible-portion",
    }],
    servings: 0,
  }), [fixtureIngredient]);

  assert.equal(missing.valid, false);
  assert.ok(missing.errors.some((error) => /positive number/.test(error)));
  assert.ok(missing.errors.some((error) => /missing from the ingredient database/.test(error)));
});

test("only source-complete, ingredient-matched recipes with verification evidence are eligible", () => {
  const complete = completeRecipe();
  assert.equal(evaluateRecipeVerification(complete, [fixtureIngredient]).eligible, true);

  const incomplete = completeRecipe({
    allergenInformationStatus: "partial",
    servingCountPrecision: "estimated",
    sourceIngredientCoverage: "source-listed",
    unmappedIngredients: ["an unmapped source ingredient"],
  });
  const result = evaluateRecipeVerification(incomplete, [fixtureIngredient]);

  assert.equal(result.eligible, false);
  assert.ok(result.reasons.some((reason) => /Allergen coverage is not complete/.test(reason)));
  assert.ok(result.reasons.some((reason) => /Serving yield is not verified/.test(reason)));
  assert.ok(result.reasons.some((reason) => /source ingredients are unmapped/.test(reason)));
});

test("detects duplicate IDs across the recipe catalog", () => {
  const result = validateRecipeDatabase([
    completeRecipe(),
    completeRecipe({ name: "Duplicate ID recipe" }),
  ], [fixtureIngredient]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /Recipe ID .* duplicated/.test(error)));
});

test("detects duplicate recipe names regardless of case and surrounding whitespace", () => {
  const result = validateRecipeDatabase([
    completeRecipe({ id: "fixture-recipe-one", name: "Besan Chilla" }),
    completeRecipe({ id: "fixture-recipe-two", name: "  besan chilla " }),
  ], [fixtureIngredient]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /Recipe name .* duplicated/.test(error)));
});
