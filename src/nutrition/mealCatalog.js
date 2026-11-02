import { ingredients } from "./database/ingredients.js";
import { calculateRecipeNutrition } from "./database/nutritionCalculator.js";
import { recipes } from "./database/recipes.js";

export function createMealCatalog(recipeRecords, ingredientRecords) {
  if (!Array.isArray(recipeRecords) || !Array.isArray(ingredientRecords)) {
    return Object.freeze({
      meals: Object.freeze([]),
      unavailableReason: "Verified recipe and ingredient records are unavailable.",
    });
  }

  const ingredientById = new Map(ingredientRecords.map((ingredient) => [ingredient.id, ingredient]));
  const meals = recipeRecords.flatMap((recipe) => {
    const nutrition = calculateRecipeNutrition(recipe, ingredientRecords);
    if (!nutrition.available || !nutrition.verified) return [];

    return [Object.freeze({
      id: recipe.id,
      name: recipe.name,
      mealType: recipe.mealCategory,
      calories: nutrition.perServing.calories,
      protein: nutrition.perServing.protein,
      carbohydrates: nutrition.perServing.carbohydrates,
      fat: nutrition.perServing.fat,
      fiber: nutrition.perServing.fibre,
      portionSize: recipe.servingDescription,
      ingredients: Object.freeze(recipe.ingredients.map((item) => Object.freeze({
        name: ingredientById.get(item.ingredientId).name,
        quantityGrams: item.quantityGrams,
      }))),
      allergens: Object.freeze([...recipe.allergens]),
      tags: Object.freeze([...recipe.dietaryTags]),
      sourceName: recipe.provenance.sourceName,
      sourceUrl: recipe.provenance.sourceUrl,
    })];
  });

  return Object.freeze({
    meals: Object.freeze(meals),
    unavailableReason: meals.length
      ? null
      : "No verified recipe and ingredient nutrition records are configured.",
  });
}

export const mealCatalog = createMealCatalog(recipes, ingredients);
