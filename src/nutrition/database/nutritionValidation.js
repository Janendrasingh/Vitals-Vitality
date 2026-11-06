import { nutritionUnits } from "./nutritionUnits.js";

const requiredNutrients = ["calories", "protein", "carbohydrates", "fat", "fibre"];
const allowedVerificationStatuses = new Set(["verified", "estimated", "unverified"]);
const requiredRecipeEvidence = [
  "composition",
  "quantities",
  "preparation",
  "yield",
  "dietaryClassification",
  "allergens",
];

function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function hasSource(source) {
  return Boolean(
    source
    && typeof source.sourceName === "string"
    && source.sourceName.trim()
    && typeof source.sourceReference === "string"
    && source.sourceReference.trim()
    && isHttpsUrl(source.sourceUrl)
  );
}

function normalizedName(value) {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}

function ingredientRecordsToArray(records) {
  if (records instanceof Map) return [...records.values()];
  return Array.isArray(records) ? records : [];
}

export function validateIngredientRecords(records) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(records)) {
    return { valid: false, errors: ["Ingredient database must be an array."], warnings };
  }

  const ids = new Set();
  const names = new Set();
  for (const [index, ingredient] of records.entries()) {
    const label = `Ingredient record ${index + 1}`;
    if (!ingredient || typeof ingredient !== "object" || Array.isArray(ingredient)) {
      errors.push(`${label} must be an object.`);
      continue;
    }

    if (typeof ingredient.id !== "string" || !ingredient.id.trim()) {
      errors.push(`${label} must have a non-empty ID.`);
    } else if (ids.has(ingredient.id)) {
      errors.push(`Ingredient ID "${ingredient.id}" is duplicated.`);
    } else {
      ids.add(ingredient.id);
    }

    const name = normalizedName(ingredient.name);
    if (!name) errors.push(`${label} must have a name.`);
    else if (names.has(name)) errors.push(`Ingredient name "${ingredient.name}" is duplicated.`);
    else names.add(name);

    if (typeof ingredient.category !== "string" || !ingredient.category.trim()) {
      errors.push(`${label} is missing its category.`);
    }
    if (typeof ingredient.preparationState !== "string" || !ingredient.preparationState.trim()) {
      errors.push(`${label} is missing its preparation state.`);
    }
    if (typeof ingredient.quantityBasis !== "string" || !ingredient.quantityBasis.trim()) {
      errors.push(`${label} is missing its quantity basis.`);
    }
    if (!hasSource(ingredient.source)) errors.push(`${label} must have a source name, exact reference, and HTTPS URL.`);

    const nutrients = ingredient.nutritionPer100g;
    if (!nutrients || typeof nutrients !== "object" || Array.isArray(nutrients)) {
      errors.push(`${label} is missing per-100-gram nutrition.`);
      continue;
    }
    const units = ingredient.nutritionUnits;
    if (!units || typeof units !== "object" || Array.isArray(units)) {
      errors.push(`${label} is missing nutrient units.`);
    }
    for (const [key, value] of Object.entries(nutrients)) {
      const expectedUnit = nutritionUnits[key];
      if (!expectedUnit) {
        errors.push(`${label} has an unsupported nutrient key "${key}" with no defined unit.`);
      } else if (units?.[key] !== expectedUnit) {
        errors.push(`${label} has an invalid unit for ${key}; expected "${expectedUnit}".`);
      }
      if (value !== null && (!Number.isFinite(value) || value < 0)) {
        errors.push(`${label} has an invalid ${key} value.`);
      }
    }
    if (units && typeof units === "object" && !Array.isArray(units)) {
      for (const [key, unit] of Object.entries(units)) {
        if (!(key in nutrients)) {
          errors.push(`${label} has a unit for missing nutrient "${key}".`);
        } else if (nutritionUnits[key] && unit !== nutritionUnits[key]) {
          errors.push(`${label} has an invalid unit for ${key}; expected "${nutritionUnits[key]}".`);
        }
      }
    }

    const missing = requiredNutrients.filter((key) => !Number.isFinite(nutrients[key]));
    if (
      Array.isArray(ingredient.missingRequiredNutrients)
      && [...ingredient.missingRequiredNutrients].sort().join("|") !== [...missing].sort().join("|")
    ) {
      errors.push(`${label} missing-nutrient metadata does not match its values.`);
    }
    if (missing.length) {
      warnings.push(`${label} is missing required nutrients: ${missing.join(", ")}.`);
      if (ingredient.verificationStatus === "verified") {
        errors.push(`${label} cannot be verified with missing required nutrients.`);
      }
    }
    if (!allowedVerificationStatuses.has(ingredient.verificationStatus)) {
      errors.push(`${label} has an unsupported verification status.`);
    }
    if (ingredient.verificationStatus === "verified" && !hasSource(ingredient.source)) {
      errors.push(`${label} cannot be verified without a valid source.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateRecipeRecord(recipe, ingredientRecords) {
  const errors = [];
  const warnings = [];
  const ingredientById = new Map(
    ingredientRecordsToArray(ingredientRecords)
      .filter((ingredient) => ingredient && typeof ingredient.id === "string")
      .map((ingredient) => [ingredient.id, ingredient])
  );

  if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
    return { valid: false, errors: ["Recipe must be an object."], warnings };
  }
  if (typeof recipe.id !== "string" || !recipe.id.trim()) errors.push("Recipe must have a non-empty ID.");
  if (!Number.isFinite(recipe.servings) || recipe.servings <= 0) errors.push("Recipe servings must be a positive number.");
  if (typeof recipe.servingDescription !== "string" || !recipe.servingDescription.trim()) {
    errors.push("Recipe serving information is missing.");
  }
  if (typeof recipe.cookingMethod !== "string" || !recipe.cookingMethod.trim()) {
    errors.push("Recipe preparation information is missing.");
  }
  if (!Array.isArray(recipe.preparationInstructions) || recipe.preparationInstructions.length === 0) {
    errors.push("Recipe preparation instructions are missing.");
  }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push("Recipe must contain at least one mapped ingredient.");
  }
  if (!Array.isArray(recipe.sourceIngredients) || recipe.sourceIngredients.length === 0) {
    warnings.push("The full source ingredient list has not been recorded.");
  }
  if (!Array.isArray(recipe.unmappedIngredients)) errors.push("Recipe unmapped ingredients must be an array.");
  if (!Array.isArray(recipe.dietaryTags)) errors.push("Recipe dietary tags must be an array.");
  if (!Array.isArray(recipe.allergens)) errors.push("Recipe allergens must be an array.");
  if (!hasSource(recipe.provenance)) errors.push("Recipe must have a source name, exact reference, and HTTPS URL.");
  if (!allowedVerificationStatuses.has(recipe.verificationStatus)) {
    errors.push("Recipe has an unsupported verification status.");
  }
  if (!["complete", "partial", "unverified"].includes(recipe.nutritionCoverage)) {
    errors.push("Recipe has an unsupported nutrition coverage status.");
  }
  if (!["complete", "partial", "unverified"].includes(recipe.allergenInformationStatus)) {
    errors.push("Recipe has an unsupported allergen information status.");
  }

  const seenIngredientIds = new Set();
  for (const [index, item] of (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`Recipe ingredient ${index + 1} must be an object.`);
      continue;
    }
    if (typeof item.ingredientId !== "string" || !item.ingredientId.trim()) {
      errors.push(`Recipe ingredient ${index + 1} must have an ingredient ID.`);
      continue;
    }
    if (seenIngredientIds.has(item.ingredientId)) {
      errors.push(`Recipe ingredient "${item.ingredientId}" is duplicated.`);
    }
    seenIngredientIds.add(item.ingredientId);

    const ingredient = ingredientById.get(item.ingredientId);
    if (!ingredient) {
      errors.push(`Ingredient "${item.ingredientId}" is missing from the ingredient database.`);
      continue;
    }
    if (!Number.isFinite(item.quantityGrams) || item.quantityGrams <= 0) {
      errors.push(`Ingredient "${item.ingredientId}" must have a positive quantity in grams.`);
    }
    if (item.preparationState !== ingredient.preparationState) {
      errors.push(`Ingredient "${item.ingredientId}" preparation state does not match its nutrition record.`);
    }
    if (item.quantityBasis !== ingredient.quantityBasis) {
      errors.push(`Ingredient "${item.ingredientId}" quantity basis does not match its nutrition record.`);
    }
    if (item.quantityPrecision !== "exact") {
      warnings.push(`Ingredient "${item.ingredientId}" quantity is estimated.`);
    }
    if (item.ingredientMatchStatus !== "verified") {
      warnings.push(`Ingredient "${item.ingredientId}" match to the recipe source is not verified.`);
    }
    if (ingredient.verificationStatus !== "verified") {
      warnings.push(`Ingredient "${item.ingredientId}" nutrition is not verified.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function evaluateRecipeVerification(recipe, ingredientRecords) {
  const validation = validateRecipeRecord(recipe, ingredientRecords);
  const reasons = [...validation.errors];
  if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
    return { eligible: false, reasons };
  }

  if (recipe.verificationStatus !== "verified") reasons.push("Recipe composition is not verified.");
  if (recipe.nutritionCoverage !== "complete") reasons.push("Nutrition coverage is not complete.");
  if (recipe.allergenInformationStatus !== "complete") reasons.push("Allergen coverage is not complete.");
  if (recipe.servingCountPrecision !== "verified") reasons.push("Serving yield is not verified.");
  if (recipe.sourceIngredientCoverage !== "complete") reasons.push("Source ingredient coverage is not verified as complete.");
  if (recipe.dietaryClassificationStatus !== "verified") reasons.push("Dietary classification is not verified.");
  if (!Array.isArray(recipe.unmappedIngredients) || recipe.unmappedIngredients.length > 0) {
    reasons.push("One or more source ingredients are unmapped.");
  }
  if (!Array.isArray(recipe.sourceIngredients) || recipe.sourceIngredients.length === 0) {
    reasons.push("The full source ingredient list is not available.");
  }

  for (const evidenceType of requiredRecipeEvidence) {
    const evidence = recipe.verificationEvidence?.[evidenceType];
    if (
      evidence?.status !== "verified"
      || typeof evidence.sourceReference !== "string"
      || !evidence.sourceReference.trim()
      || !isHttpsUrl(evidence.sourceUrl)
    ) {
      reasons.push(`Verified evidence for ${evidenceType} is missing.`);
    }
  }

  const ingredientById = new Map(
    ingredientRecordsToArray(ingredientRecords)
      .map((ingredient) => [ingredient.id, ingredient])
  );
  for (const item of Array.isArray(recipe.ingredients) ? recipe.ingredients : []) {
    const ingredient = ingredientById.get(item?.ingredientId);
    if (!ingredient || ingredient.verificationStatus !== "verified") {
      reasons.push(`Ingredient "${item?.ingredientId ?? "unknown"}" is not verified.`);
    }
    if (item?.quantityPrecision !== "exact") {
      reasons.push(`Ingredient "${item?.ingredientId ?? "unknown"}" quantity is not exact.`);
    }
    if (item?.ingredientMatchStatus !== "verified") {
      reasons.push(`Ingredient "${item?.ingredientId ?? "unknown"}" source match is not verified.`);
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  return {
    eligible: validation.valid && uniqueReasons.length === 0,
    reasons: uniqueReasons,
  };
}

export function validateRecipeDatabase(recipes, ingredientRecords) {
  const errors = [];
  const seenIds = new Set();
  const seenNames = new Set();
  if (!Array.isArray(recipes)) return { valid: false, errors: ["Recipe database must be an array."] };
  recipes.forEach((recipe, index) => {
    if (recipe && typeof recipe.id === "string") {
      if (seenIds.has(recipe.id)) errors.push(`Recipe ID "${recipe.id}" is duplicated.`);
      seenIds.add(recipe.id);
    }
    if (recipe && typeof recipe.name === "string" && recipe.name.trim()) {
      const normalizedName = recipe.name.trim().toLocaleLowerCase();
      if (seenNames.has(normalizedName)) errors.push(`Recipe name "${recipe.name}" is duplicated.`);
      seenNames.add(normalizedName);
    }
    const result = validateRecipeRecord(recipe, ingredientRecords);
    errors.push(...result.errors.map((error) => `Recipe ${index + 1}: ${error}`));
  });
  return { valid: errors.length === 0, errors };
}
