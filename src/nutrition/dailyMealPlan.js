import { calculateDailyNutritionBalance } from "./dailyNutritionBalance.js";
import { recommendMeals } from "./mealRecommendations.js";

export const DEFAULT_MEAL_DISTRIBUTION = Object.freeze({
  breakfast: 25,
  midMorningSnack: 10,
  lunch: 30,
  eveningSnack: 10,
  dinner: 25,
});

const mealSlots = [
  { id: "breakfast", mealType: "breakfast", label: "Breakfast" },
  { id: "mid-morning-snack", mealType: "evening-snacks", label: "Mid-morning snack", distributionKey: "midMorningSnack" },
  { id: "lunch", mealType: "lunch", label: "Lunch" },
  { id: "evening-snack", mealType: "evening-snacks", label: "Evening snack", distributionKey: "eveningSnack" },
  { id: "dinner", mealType: "dinner", label: "Dinner" },
];

const mealTypes = Object.freeze({
  breakfast: "breakfast",
  "mid-morning-snack": "evening-snacks",
  lunch: "lunch",
  "evening-snack": "evening-snacks",
  dinner: "dinner",
});

function isValidDistribution(distribution) {
  if (!distribution || typeof distribution !== "object") return false;
  const values = mealSlots.map((slot) => distribution[slot.distributionKey || slot.id]);
  return values.every((value) => Number.isFinite(value) && value > 0 && value <= 100)
    && Math.abs(values.reduce((sum, value) => sum + value, 0) - 100) < 0.01;
}

function getConfiguredSlots(distribution) {
  return mealSlots.map((slot) => ({
    ...slot,
    calorieShare: distribution[slot.distributionKey || slot.id] / 100,
  }));
}

function mealRecords(slots) {
  return slots.map((slot) => slot.recommendation).filter(Boolean);
}

function totalsFor(meals) {
  return Object.fromEntries(["calories", "protein", "carbohydrates", "fat"].map((nutrient) => [
    nutrient,
    meals.length > 0 && meals.every((meal) => Number.isFinite(meal[nutrient]))
      ? meals.reduce((sum, meal) => sum + meal[nutrient], 0)
      : null,
  ]));
}

function assemblePlan({ slots, targets, loggedMeals, distribution, status, reason, replacementError = null }) {
  const plannedMeals = mealRecords(slots);
  const dailyBalance = calculateDailyNutritionBalance(targets, [
    ...loggedMeals,
    ...plannedMeals,
  ]);
  return {
    status,
    reason,
    replacementError,
    slots,
    distribution: Object.freeze({ ...distribution }),
    filledSlots: plannedMeals.length,
    totalSlots: slots.length,
    planTotals: Object.freeze(totalsFor(plannedMeals)),
    dailyBalance,
  };
}

function emptySlots(distribution = DEFAULT_MEAL_DISTRIBUTION) {
  return getConfiguredSlots(distribution).map((slot) => ({
    ...slot,
    recommendation: null,
  }));
}

function unavailablePlan(reason, targets, loggedMeals, distribution) {
  return assemblePlan({
    slots: emptySlots(distribution),
    targets,
    loggedMeals,
    distribution,
    status: "unavailable",
    reason,
  });
}

export function generateDailyMealPlan({
  source,
  targets,
  loggedMeals = [],
  diets = [],
  allergies = [],
  preferences = [],
  activity = null,
  distribution = DEFAULT_MEAL_DISTRIBUTION,
} = {}) {
  if (!isValidDistribution(distribution)) {
    return unavailablePlan(
      "Meal calorie shares must be valid percentages that add up to 100%.",
      targets,
      Array.isArray(loggedMeals) ? loggedMeals : [],
      DEFAULT_MEAL_DISTRIBUTION,
    );
  }
  if (!Array.isArray(loggedMeals)) {
    return unavailablePlan("Today's logged meals are unavailable.", targets, [], distribution);
  }
  if (!targets?.available) {
    return unavailablePlan(
      targets?.error || "Complete your profile to calculate daily nutrition targets.",
      targets,
      loggedMeals,
      distribution,
    );
  }

  const balance = calculateDailyNutritionBalance(targets, loggedMeals);
  if (!balance.available) {
    return unavailablePlan(
      "A meal plan cannot be calculated while logged nutrition or remaining daily targets are incomplete.",
      targets,
      loggedMeals,
      distribution,
    );
  }

  const configuredSlots = getConfiguredSlots(distribution);
  const recommendation = recommendMeals({
    source,
    calorieTarget: targets.calorieTarget,
    remainingCalories: balance.remaining.calories,
    proteinTarget: targets.proteinTarget,
    carbohydrateTarget: targets.carbohydrateTarget,
    fatTarget: targets.fatTarget,
    remainingProtein: balance.remaining.protein,
    remainingCarbohydrates: balance.remaining.carbohydrates,
    remainingFat: balance.remaining.fat,
    diets,
    allergies,
    preferences,
    activity,
    consumedMealIds: loggedMeals.map((meal) => meal?.id).filter(Boolean),
    consumedMealNames: loggedMeals.map((meal) => meal?.name).filter(Boolean),
    slots: configuredSlots,
    distributionFromInitial: true,
  });

  const slots = recommendation.meals.map((slot, index) => ({
    ...configuredSlots[index],
    recommendation: slot.recommendation,
  }));
  const filledSlots = mealRecords(slots).length;
  const status = filledSlots === slots.length
    ? "ready"
    : filledSlots > 0
      ? "partial"
      : "unavailable";
  const reason = status === "ready"
    ? null
    : status === "partial"
      ? `Only ${filledSlots} of ${slots.length} meal slots have a suitable verified recipe. More verified recipes are needed to complete this plan.`
      : recommendation.reason || "More verified recipes are needed before a safe meal plan can be generated.";

  return assemblePlan({
    slots,
    targets,
    loggedMeals,
    distribution,
    status,
    reason,
  });
}

export function replaceDailyMealPlanItem({
  plan,
  slotId,
  source,
  targets,
  loggedMeals = [],
  diets = [],
  allergies = [],
  preferences = [],
  activity = null,
} = {}) {
  if (!plan || !Array.isArray(plan.slots) || !Array.isArray(loggedMeals)) {
    return {
      ...plan,
      replacementError: "The current meal plan or logged meals are unavailable.",
    };
  }
  const slot = plan.slots.find((item) => item.id === slotId);
  if (!slot) return { ...plan, replacementError: "The selected meal slot does not exist." };

  const otherSlots = plan.slots.filter((item) => item.id !== slotId);
  const otherMeals = mealRecords(otherSlots);
  const remainingBalance = calculateDailyNutritionBalance(targets, [
    ...loggedMeals,
    ...otherMeals,
  ]);
  if (!remainingBalance.available) {
    return {
      ...plan,
      replacementError: "A replacement cannot be calculated because remaining daily nutrition is unavailable.",
    };
  }

  const mealsToExclude = [...loggedMeals, ...mealRecords(plan.slots)];
  const recommendation = recommendMeals({
    source,
    calorieTarget: targets.calorieTarget,
    remainingCalories: remainingBalance.remaining.calories,
    proteinTarget: targets.proteinTarget,
    carbohydrateTarget: targets.carbohydrateTarget,
    fatTarget: targets.fatTarget,
    remainingProtein: remainingBalance.remaining.protein,
    remainingCarbohydrates: remainingBalance.remaining.carbohydrates,
    remainingFat: remainingBalance.remaining.fat,
    diets,
    allergies,
    preferences,
    activity,
    consumedMealIds: mealsToExclude.map((meal) => meal?.id).filter(Boolean),
    consumedMealNames: mealsToExclude.map((meal) => meal?.name).filter(Boolean),
    slots: [{
      ...slot,
      calorieShare: 1,
      mealType: mealTypes[slotId],
    }],
    distributionFromInitial: true,
  });
  const replacement = recommendation.meals[0]?.recommendation;
  if (!replacement) {
    return {
      ...plan,
      replacementError: recommendation.reason || "No other suitable verified meal is available for this slot.",
    };
  }

  const updatedSlots = plan.slots.map((item) =>
    item.id === slotId ? { ...item, recommendation: replacement } : item
  );
  const filledSlots = mealRecords(updatedSlots).length;
  return assemblePlan({
    slots: updatedSlots,
    targets,
    loggedMeals,
    distribution: plan.distribution,
    status: filledSlots === updatedSlots.length ? "ready" : filledSlots ? "partial" : "unavailable",
    reason: plan.reason,
  });
}
