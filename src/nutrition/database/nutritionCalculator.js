import { evaluateRecipeVerification } from "./nutritionValidation.js";

const requiredNutrientKeys = ["calories", "protein", "carbohydrates", "fat", "fibre"];
const mealCategories = new Set(["breakfast", "lunch", "evening-snacks", "dinner"]);

export const nutritionNutrientLabels = Object.freeze({
  calories: "Calories (kcal)",
  protein: "Protein (g)",
  carbohydrates: "Carbohydrates (g)",
  fat: "Fat (g)",
  fibre: "Fibre (g)",
  sugars: "Sugars (g)",
  calcium: "Calcium (mg)",
  iron: "Iron (mg)",
  magnesium: "Magnesium (mg)",
  phosphorus: "Phosphorus (mg)",
  potassium: "Potassium (mg)",
  sodium: "Sodium (mg)",
  zinc: "Zinc (mg)",
  copper: "Copper (mg)",
  selenium: "Selenium (µg)",
  vitaminA: "Vitamin A (µg RAE)",
  vitaminE: "Vitamin E (mg)",
  vitaminC: "Vitamin C (mg)",
  thiamin: "Thiamin (mg)",
  riboflavin: "Riboflavin (mg)",
  niacin: "Niacin (mg)",
  pantothenicAcid: "Pantothenic acid (mg)",
  vitaminB6: "Vitamin B6 (mg)",
  folate: "Folate (µg)",
  vitaminB12: "Vitamin B12 (µg)",
  vitaminK: "Vitamin K (µg)",
});

export const nutritionCalculationNote = "Nutrition is calculated from cited per-100-gram ingredient records and the entered edible quantities. Preparation state and quantity basis must match; no cooking-yield or oil-absorption conversion is inferred. An optional nutrient is reported only when every non-zero ingredient has a source value for it.";

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function indexIngredients(ingredientDatabase, errors) {
  const records = ingredientDatabase instanceof Map
    ? [...ingredientDatabase.values()]
    : Array.isArray(ingredientDatabase)
      ? ingredientDatabase
      : null;

  if (!records) {
    errors.push("Ingredient database must be an array or Map of ingredient records.");
    return new Map();
  }

  const index = new Map();
  for (const ingredient of records) {
    if (!ingredient || typeof ingredient.id !== "string" || !ingredient.id.trim()) {
      errors.push("Every ingredient record must have a non-empty unique ID.");
      continue;
    }
    if (index.has(ingredient.id)) {
      errors.push(`Ingredient ID "${ingredient.id}" is duplicated.`);
      continue;
    }
    index.set(ingredient.id, ingredient);
  }
  return index;
}

function validateSource(source, label, errors) {
  if (!source || typeof source !== "object") {
    errors.push(`${label} is missing its source reference.`);
    return false;
  }
  const valid = typeof source.sourceName === "string"
    && Boolean(source.sourceName.trim())
    && typeof source.sourceReference === "string"
    && Boolean(source.sourceReference.trim())
    && isHttpsUrl(source.sourceUrl);
  if (!valid) errors.push(`${label} must include a source name, exact reference, and HTTPS source URL.`);
  return valid;
}

function validateNutrition(nutrition, label, errors) {
  if (!nutrition || typeof nutrition !== "object") {
    errors.push(`${label} is missing its per-100-gram nutrition record.`);
    return false;
  }
  const missing = requiredNutrientKeys.filter((key) =>
    !Number.isFinite(nutrition[key]) || nutrition[key] < 0
  );
  if (missing.length) {
    errors.push(`${label} has missing or invalid nutrient values: ${missing.join(", ")}.`);
    return false;
  }
  const invalidOptional = Object.entries(nutrition).filter(([key, value]) =>
    !requiredNutrientKeys.includes(key)
    && value !== null
    && (!Number.isFinite(value) || value < 0)
  );
  if (invalidOptional.length) {
    errors.push(`${label} has invalid optional nutrient values: ${invalidOptional.map(([key]) => key).join(", ")}.`);
    return false;
  }
  return true;
}

function roundNutrients(nutrients) {
  return Object.fromEntries(
    Object.entries(nutrients).map(([key, value]) => [
      key,
      Number.isFinite(value)
        ? Math.round((value + Number.EPSILON) * 100) / 100
        : null,
    ])
  );
}

function unavailable(errors, missingNutrients = []) {
  return {
    available: false,
    verified: false,
    errors,
    warnings: [],
    missingNutrients,
    calculationNote: nutritionCalculationNote,
    servings: null,
    total: null,
    perServing: null,
  };
}

function calculateIngredientNutrition(
  recipeIngredients,
  ingredientDatabase,
  servingCount,
  { requirePreparationDetails = false } = {},
) {
  const errors = [];
  const ingredientIndex = indexIngredients(ingredientDatabase, errors);
  const records = Array.isArray(recipeIngredients) ? recipeIngredients : [];
  const resolved = [];
  const seenIngredientIds = new Set();
  const missingRequiredNutrients = new Set();

  for (const [position, recipeIngredient] of records.entries()) {
    const label = `Recipe ingredient ${position + 1}`;
    if (!recipeIngredient || typeof recipeIngredient !== "object") {
      errors.push(`${label} must be an object.`);
      continue;
    }
    const { ingredientId, quantityGrams, preparationState, quantityBasis } = recipeIngredient;
    if (typeof ingredientId !== "string" || !ingredientId.trim()) {
      errors.push(`${label} must have an ingredient ID.`);
      continue;
    }
    if (seenIngredientIds.has(ingredientId)) {
      errors.push(`Ingredient "${ingredientId}" is duplicated in the recipe.`);
      continue;
    }
    seenIngredientIds.add(ingredientId);
    const ingredient = ingredientIndex.get(ingredientId);
    if (!ingredient) {
      errors.push(`Ingredient "${ingredientId}" is missing from the ingredient database.`);
      continue;
    }
    if (!Number.isFinite(quantityGrams) || quantityGrams < 0) {
      errors.push(`Ingredient "${ingredientId}" must have a non-negative quantity in grams.`);
      continue;
    }
    if (requirePreparationDetails && (typeof preparationState !== "string" || !preparationState.trim())) {
      errors.push(`Ingredient "${ingredientId}" must specify its preparation state.`);
    } else if (preparationState !== ingredient.preparationState) {
      if (preparationState !== undefined && preparationState !== null) {
        errors.push(`Ingredient "${ingredientId}" preparation state does not match its nutrition record.`);
      }
    }
    if (requirePreparationDetails && (typeof quantityBasis !== "string" || !quantityBasis.trim())) {
      errors.push(`Ingredient "${ingredientId}" must specify its edible or consumed quantity basis.`);
    } else if (quantityBasis !== ingredient.quantityBasis) {
      if (quantityBasis !== undefined && quantityBasis !== null) {
        errors.push(`Ingredient "${ingredientId}" quantity basis does not match its nutrition record.`);
      }
    }
    validateNutrition(ingredient.nutritionPer100g, `Ingredient "${ingredientId}"`, errors);
    requiredNutrientKeys.forEach((key) => {
      if (!Number.isFinite(ingredient.nutritionPer100g?.[key])) {
        missingRequiredNutrients.add(key);
      }
    });
    validateSource(ingredient.source, `Ingredient "${ingredientId}"`, errors);
    resolved.push({ ingredient, quantityGrams });
  }

  if (errors.length) return unavailable(errors, [...missingRequiredNutrients]);

  const nutrientKeys = new Set(requiredNutrientKeys);
  resolved.forEach(({ ingredient }) => {
    Object.keys(ingredient.nutritionPer100g).forEach((key) => nutrientKeys.add(key));
  });
  const total = {};
  const unavailableOptionalNutrients = [];

  for (const key of nutrientKeys) {
    const complete = resolved.every(({ ingredient, quantityGrams }) =>
      quantityGrams === 0 || Number.isFinite(ingredient.nutritionPer100g[key])
    );
    if (!complete) {
      total[key] = null;
      if (!requiredNutrientKeys.includes(key)) unavailableOptionalNutrients.push(key);
      continue;
    }
    total[key] = resolved.reduce(
      (sum, { ingredient, quantityGrams }) =>
        sum + ((ingredient.nutritionPer100g[key] || 0) * quantityGrams) / 100,
      0
    );
  }

  const roundedTotal = roundNutrients(total);
  const perServing = roundNutrients(
    Object.fromEntries(Object.entries(total).map(([key, value]) => [
      key,
      Number.isFinite(value) ? value / servingCount : null,
    ]))
  );
  const ingredientDataVerified = resolved.every(
    ({ ingredient }) => ingredient.verificationStatus === "verified"
  );
  const warnings = [];
  if (!ingredientDataVerified) warnings.push("One or more ingredient nutrition records are not verified.");
  if (unavailableOptionalNutrients.length) {
    warnings.push(`Optional nutrient totals are unavailable: ${unavailableOptionalNutrients.join(", ")}.`);
  }

  return {
    available: true,
    verified: ingredientDataVerified,
    errors: [],
    warnings,
    missingNutrients: unavailableOptionalNutrients,
    calculationNote: nutritionCalculationNote,
    servings: servingCount,
    total: roundedTotal,
    perServing,
  };
}

export function calculateMealNutrition(
  ingredients,
  ingredientDatabase,
  { servings = 1 } = {},
) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return unavailable(["A meal must contain at least one ingredient."]);
  }
  if (!isPositiveNumber(servings)) {
    return unavailable(["Meal servings must be a positive number."]);
  }
  return calculateIngredientNutrition(ingredients, ingredientDatabase, servings);
}

export function calculateRecipeNutrition(
  recipe,
  ingredientDatabase,
  { servings } = {},
) {
  const errors = [];
  if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
    return unavailable(["Recipe must be an object."]);
  }
  if (typeof recipe.id !== "string" || !recipe.id.trim()) errors.push("Recipe must have a non-empty ID.");
  if (typeof recipe.name !== "string" || !recipe.name.trim()) errors.push("Recipe must have a non-empty name.");
  if (!mealCategories.has(recipe.mealCategory)) errors.push("Recipe has an unsupported meal category.");
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push("Recipe must contain at least one ingredient.");
  }

  const servingCount = servings === undefined ? recipe.servings : servings;
  if (!isPositiveNumber(servingCount)) errors.push("Recipe servings must be a positive number.");
  validateSource(recipe.provenance, "Recipe provenance", errors);
  if (typeof recipe.cookingMethod !== "string" || !recipe.cookingMethod.trim()) {
    errors.push("Recipe cooking method is missing.");
  }
  if (!Array.isArray(recipe.preparationAssumptions) || recipe.preparationAssumptions.length === 0) {
    errors.push("Recipe preparation assumptions must be documented.");
  }
  if (!Array.isArray(recipe.dietaryTags)) errors.push("Recipe dietary tags must be an array.");
  if (!Array.isArray(recipe.allergens)) errors.push("Recipe declared allergens must be an array.");
  if (typeof recipe.servingDescription !== "string" || !recipe.servingDescription.trim()) {
    errors.push("Recipe serving information is missing.");
  }

  const recipeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  for (const [position, ingredient] of recipeIngredients.entries()) {
    if (!ingredient || typeof ingredient !== "object") continue;
    const label = typeof ingredient.ingredientId === "string"
      ? `Ingredient "${ingredient.ingredientId}"`
      : `Recipe ingredient ${position + 1}`;
    if (typeof ingredient.preparationState !== "string" || !ingredient.preparationState.trim()) {
      errors.push(`${label} must specify its preparation state.`);
    }
    if (typeof ingredient.quantityBasis !== "string" || !ingredient.quantityBasis.trim()) {
      errors.push(`${label} must specify its edible or consumed quantity basis.`);
    }
  }
  if (errors.length) return unavailable(errors);

  const result = calculateIngredientNutrition(
    recipeIngredients,
    ingredientDatabase,
    servingCount,
    { requirePreparationDetails: true }
  );
  if (!result.available) return result;

  const verification = evaluateRecipeVerification(recipe, ingredientDatabase);
  const recipeVerified = verification.eligible;
  const warnings = [...result.warnings];
  if (!recipeVerified) warnings.push("Recipe evidence and completeness requirements are not satisfied; this result is not recommendation-eligible.");
  if (Array.isArray(recipe.unmappedIngredients) && recipe.unmappedIngredients.length) {
    warnings.push(`${recipe.unmappedIngredients.length} source ingredient(s) are not included in the nutrition calculation.`);
  }

  return {
    ...result,
    verified: result.verified && recipeVerified,
    warnings,
    verificationReasons: verification.reasons,
  };
}

export default calculateRecipeNutrition;
