import { ingredients } from "./database/ingredients.js";
import { calculateRecipeNutrition } from "./database/nutritionCalculator.js";
import { evaluateRecipeVerification, validateRecipeRecord } from "./database/nutritionValidation.js";
import { recipes } from "./database/recipes.js";

const requiredNutrients = ["calories", "protein", "carbohydrates", "fat", "fibre"];

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

export function createMealCatalog(recipeRecords, ingredientRecords) {
  if (!Array.isArray(recipeRecords) || !Array.isArray(ingredientRecords)) {
    return Object.freeze({
      meals: Object.freeze([]),
      recipes: Object.freeze([]),
      unavailableReason: "Recipe and ingredient records are unavailable.",
    });
  }

  const ingredientById = new Map(ingredientRecords.map((ingredient) => [ingredient.id, ingredient]));
  const catalogRecipes = recipeRecords.map((recipe) => {
    const nutrition = calculateRecipeNutrition(recipe, ingredientRecords);
    const verification = evaluateRecipeVerification(recipe, ingredientRecords);
    const validation = validateRecipeRecord(recipe, ingredientRecords);
    const availableRequiredNutrientCount = requiredNutrients.filter((key) =>
      Number.isFinite(nutrition.perServing?.[key])
    ).length;
    const requiredNutrientsComplete = nutrition.available
      && availableRequiredNutrientCount === requiredNutrients.length;
    const availableNutrientCount = Object.values(nutrition.perServing ?? {})
      .filter(Number.isFinite)
      .length;
    const recommendable = verification.eligible && requiredNutrientsComplete;

    return Object.freeze({
      id: recipe.id,
      name: recipe.name,
      mealType: recipe.mealCategory,
      servings: recipe.servings,
      portionSize: recipe.servingDescription,
      servingCountPrecision: recipe.servingCountPrecision ?? "unverified",
      nutrition: Object.freeze(nutrition),
      nutritionCompleteness: Object.freeze({
        calculated: nutrition.available,
        requiredNutrientsComplete,
        availableRequiredNutrientCount,
        requiredNutrientCount: requiredNutrients.length,
        availableNutrientCount,
        coverage: recipe.nutritionCoverage ?? "unverified",
        missingNutrients: Object.freeze([...(nutrition.missingNutrients ?? [])]),
      }),
      ingredients: Object.freeze(arrayOrEmpty(recipe.ingredients).map((item) => {
        if (!item || typeof item !== "object") {
          return Object.freeze({
            ingredientId: null,
            name: "Invalid ingredient entry",
            category: null,
            quantityGrams: null,
            sourceQuantity: null,
            quantityPrecision: "unverified",
            ingredientMatchStatus: "unverified",
            verificationStatus: "unverified",
            source: Object.freeze({}),
          });
        }
        const ingredient = ingredientById.get(item.ingredientId);
        return Object.freeze({
          ingredientId: item.ingredientId,
          name: ingredient?.name ?? item.ingredientId,
          category: ingredient?.category ?? null,
          quantityGrams: item.quantityGrams,
          sourceQuantity: item.sourceQuantity ?? null,
          quantityPrecision: item.quantityPrecision ?? "unverified",
          ingredientMatchStatus: item.ingredientMatchStatus ?? "unverified",
          verificationStatus: ingredient?.verificationStatus ?? "unverified",
          source: Object.freeze({ ...(ingredient?.source ?? {}) }),
        });
      })),
      unmappedIngredients: Object.freeze([...arrayOrEmpty(recipe.unmappedIngredients)]),
      sourceIngredients: Object.freeze([...arrayOrEmpty(recipe.sourceIngredients)]),
      instructions: Object.freeze([...arrayOrEmpty(recipe.preparationInstructions)]),
      allergens: Object.freeze([...arrayOrEmpty(recipe.allergens)]),
      allergenInformationStatus: recipe.allergenInformationStatus ?? "unverified",
      tags: Object.freeze([...arrayOrEmpty(recipe.dietaryTags)]),
      dietaryClassificationStatus: recipe.dietaryClassificationStatus ?? "unverified",
      sourceIngredientCoverage: recipe.sourceIngredientCoverage ?? "not-checked",
      verificationStatus: recipe.verificationStatus ?? "unverified",
      verificationNote: recipe.verificationNote ?? "Recipe verification status is not supplied.",
      nutritionCoverage: recipe.nutritionCoverage ?? "unverified",
      provenance: Object.freeze({ ...recipe.provenance }),
      validation: Object.freeze(validation),
      verificationReasons: Object.freeze(verification.reasons),
      recommendable,
    });
  });

  const meals = catalogRecipes.flatMap((recipe) => {
    if (!recipe.recommendable) return [];
    const { nutrition } = recipe;
    return [Object.freeze({
      id: recipe.id,
      name: recipe.name,
      mealType: recipe.mealType,
      calories: nutrition.perServing.calories,
      protein: nutrition.perServing.protein,
      carbohydrates: nutrition.perServing.carbohydrates,
      fat: nutrition.perServing.fat,
      fiber: nutrition.perServing.fibre,
      portionSize: recipe.portionSize,
      nutritionPerServing: Object.freeze({ ...nutrition.perServing }),
      ingredients: Object.freeze(recipe.ingredients.map(({ name, category, quantityGrams }) => Object.freeze({
        name,
        category,
        quantityGrams,
      }))),
      allergens: recipe.allergens,
      tags: recipe.tags,
      sourceName: recipe.provenance.sourceName,
      sourceUrl: recipe.provenance.sourceUrl,
    })];
  });

  return Object.freeze({
    meals: Object.freeze(meals),
    recipes: Object.freeze(catalogRecipes),
    unavailableReason: meals.length
      ? null
      : "No complete, verified recipe nutrition and allergen records are configured.",
  });
}

export const mealCatalog = createMealCatalog(recipes, ingredients);
