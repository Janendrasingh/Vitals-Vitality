const nutrients = Object.freeze({
  calories: "calorieTarget",
  protein: "proteinTarget",
  carbohydrates: "carbohydrateTarget",
  fat: "fatTarget",
});

function parseNonNegativeNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function loggedValue(meal, nutrient) {
  if (nutrient === "carbohydrates") {
    return parseNonNegativeNumber(meal.carbohydrates ?? meal.carbs);
  }
  return parseNonNegativeNumber(meal[nutrient]);
}

export function calculateDailyNutritionBalance(targets, meals) {
  const entries = Array.isArray(meals) ? meals : null;
  const errors = [];
  if (!entries) errors.push("Logged meals must be an array.");

  const consumed = {};
  const remaining = {};
  for (const [nutrient, targetField] of Object.entries(nutrients)) {
    const values = entries
      ? entries.map((meal) =>
        meal && typeof meal === "object" ? loggedValue(meal, nutrient) : null
      )
      : [null];
    const complete = values.every(Number.isFinite);
    consumed[nutrient] = complete ? values.reduce((total, value) => total + value, 0) : null;

    const target = parseNonNegativeNumber(targets?.[targetField]);
    remaining[nutrient] = complete && target !== null
      ? Math.max(target - consumed[nutrient], 0)
      : null;
    if (!complete) errors.push(`Remaining ${nutrient} is unavailable because a logged meal is missing valid ${nutrient} data.`);
    else if (target === null) errors.push(`Remaining ${nutrient} is unavailable because its daily target is invalid or unavailable.`);
  }

  return {
    available: Object.values(remaining).every(Number.isFinite),
    consumed: Object.freeze(consumed),
    remaining: Object.freeze(remaining),
    errors: Object.freeze(errors),
  };
}

export default calculateDailyNutritionBalance;
