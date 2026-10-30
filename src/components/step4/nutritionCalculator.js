import { calculateNutritionTargets } from "../../nutrition/nutritionCalculator.js";

export function calculateNutrition(data) {
  const targets = calculateNutritionTargets(data);
  return {
    ...targets,
    calories: targets.calorieTarget,
    protein: targets.proteinTarget,
    carbs: targets.carbohydrateTarget,
    fat: targets.fatTarget,
  };
}
