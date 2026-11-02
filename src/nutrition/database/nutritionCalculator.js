const nutrientKeys = ["calories", "protein", "carbohydrates", "fat", "fibre"];
const mealCategories = new Set(["breakfast", "lunch", "evening-snacks", "dinner"]);

export const nutritionCalculationNote = "Nutrition is calculated from documented ingredient weights and preparation assumptions. Ingredient weights must use the same preparation state and quantity basis as their nutrition records; no cooking-yield or oil-absorption conversion is inferred.";

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
  const missing = nutrientKeys.filter((key) =>
    !Number.isFinite(nutrition[key]) || nutrition[key] < 0
  );
  if (missing.length) {
    errors.push(`${label} has missing or invalid nutrient values: ${missing.join(", ")}.`);
    return false;
  }
  return true;
}

function roundNutrients(nutrients) {
  return Object.fromEntries(
    nutrientKeys.map((key) => [key, Math.round((nutrients[key] + Number.EPSILON) * 100) / 100])
  );
}

function unavailable(errors) {
  return {
    available: false,
    verified: false,
    errors,
    warnings: [],
    calculationNote: nutritionCalculationNote,
    servings: null,
    total: null,
    perServing: null,
  };
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
  if (!isPositiveNumber(servingCount)) {
    errors.push("Recipe servings must be a positive number.");
  }
  validateSource(recipe.provenance, "Recipe provenance", errors);

  const ingredientIndex = indexIngredients(ingredientDatabase, errors);
  const records = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const resolved = [];

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
    const ingredient = ingredientIndex.get(ingredientId);
    if (!ingredient) {
      errors.push(`Ingredient "${ingredientId}" is missing from the ingredient database.`);
      continue;
    }
    if (!Number.isFinite(quantityGrams) || quantityGrams < 0) {
      errors.push(`Ingredient "${ingredientId}" must have a non-negative quantity in grams.`);
      continue;
    }
    if (typeof preparationState !== "string" || !preparationState.trim()) {
      errors.push(`Ingredient "${ingredientId}" must specify its preparation state.`);
    } else if (preparationState !== ingredient.preparationState) {
      errors.push(`Ingredient "${ingredientId}" preparation state does not match its nutrition record.`);
    }
    if (typeof quantityBasis !== "string" || !quantityBasis.trim()) {
      errors.push(`Ingredient "${ingredientId}" must specify its edible or consumed quantity basis.`);
    } else if (quantityBasis !== ingredient.quantityBasis) {
      errors.push(`Ingredient "${ingredientId}" quantity basis does not match its nutrition record.`);
    }
    validateNutrition(ingredient.nutritionPer100g, `Ingredient "${ingredientId}"`, errors);
    validateSource(ingredient.source, `Ingredient "${ingredientId}"`, errors);
    resolved.push({ ingredient, quantityGrams });
  }

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

  if (errors.length) return unavailable(errors);

  const total = Object.fromEntries(nutrientKeys.map((key) => [key, 0]));
  for (const { ingredient, quantityGrams } of resolved) {
    for (const key of nutrientKeys) {
      total[key] += (ingredient.nutritionPer100g[key] * quantityGrams) / 100;
    }
  }

  const roundedTotal = roundNutrients(total);
  const perServing = roundNutrients(
    Object.fromEntries(nutrientKeys.map((key) => [key, total[key] / servingCount]))
  );
  const ingredientDataVerified = resolved.every(
    ({ ingredient }) => ingredient.verificationStatus === "verified"
  );
  const recipeVerified = recipe.verificationStatus === "verified";
  const verified = ingredientDataVerified && recipeVerified;
  const warnings = [];
  if (!ingredientDataVerified) warnings.push("One or more ingredient nutrition records are not verified.");
  if (!recipeVerified) warnings.push("Recipe composition and preparation have not been verified.");

  return {
    available: true,
    verified,
    errors: [],
    warnings,
    calculationNote: nutritionCalculationNote,
    servings: servingCount,
    total: roundedTotal,
    perServing,
  };
}

export default calculateRecipeNutrition;
