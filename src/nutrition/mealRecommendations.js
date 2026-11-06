const defaultMealSlots = [
  { id: "breakfast", label: "Breakfast", calorieShare: 0.25 },
  { id: "lunch", label: "Lunch", calorieShare: 0.3 },
  { id: "evening-snacks", label: "Evening Snacks", calorieShare: 0.1 },
  { id: "dinner", label: "Dinner", calorieShare: 0.35 },
];

function emptySlots(slots = defaultMealSlots) {
  return slots.map((slot) => ({
    mealType: slot.id,
    label: slot.label,
    recommendation: null,
  }));
}

const knownAllergyAliases = {
  dairy: ["dairy", "milk", "lactose", "whey", "casein"],
  peanut: ["peanut"],
  tree_nut: ["tree nut", "almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut"],
  shellfish: ["shellfish", "shrimp", "crab", "lobster"],
  soy: ["soy", "soya"],
  egg: ["egg"],
  fish: ["fish"],
  gluten: ["gluten", "wheat", "barley", "rye"],
  sesame: ["sesame"],
  honey: ["honey"],
};

const dietAliases = {
  "gluten-free": "gluten-free",
  glutenfree: "gluten-free",
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeCategory(value) {
  return normalize(value).replace(/[_-]+/g, " ");
}

function matchesAllergies(meal, allergies) {
  const declaredAllergens = Array.isArray(meal.allergens)
    ? meal.allergens.map(normalizeCategory)
    : null;
  const ingredients = Array.isArray(meal.ingredients)
    ? meal.ingredients.map((ingredient) => normalizeCategory(ingredient.name || ingredient))
    : [];

  if (!declaredAllergens) return false;
  return allergies.every((allergyValue) => {
    const allergy = normalizeCategory(allergyValue);
    if (!allergy) return true;
    const category = Object.entries(knownAllergyAliases).find(([key, aliases]) =>
      [key, ...aliases].some((alias) => allergy.includes(normalizeCategory(alias)))
    )?.[0];
    if (!category) return false;
    const aliases = knownAllergyAliases[category].map(normalizeCategory);
    const normalizedCategory = normalizeCategory(category);
    return !declaredAllergens.some((item) =>
      item === normalizedCategory || aliases.some((alias) => item.includes(alias))
    ) && !ingredients.some((item) => aliases.some((alias) => item.includes(alias)));
  });
}

function satisfiesPreferences(meal, diets, preferences) {
  const tags = Array.isArray(meal.tags) ? meal.tags.map(normalize) : [];
  const ingredients = Array.isArray(meal.ingredients)
    ? meal.ingredients.flatMap((ingredient) => {
        if (typeof ingredient === "string") return [normalize(ingredient)];
        return [
          normalize(ingredient.name),
          normalize(ingredient.category).replace(/-/g, " "),
        ].filter(Boolean);
      })
    : [];

  const meetsDiets = diets.every((dietValue) => {
    const diet = normalize(dietValue);
    const key = dietAliases[diet.replace(/\s+/g, "-")] || diet.replace(/\s+/g, "-");
    return tags.includes(key);
  });
  const meetsFoodPreferences = preferences.every((preferenceValue) => {
    const preference = normalize(preferenceValue).replace(/-/g, " ");
    return !preference || tags.includes(preference) || ingredients.some((item) => item.includes(preference));
  });

  return meetsDiets && meetsFoodPreferences;
}

function isValidSourceUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isVerifiedMeal(meal, slots) {
  return meal
    && typeof meal.id === "string"
    && Boolean(meal.id.trim())
    && typeof meal.name === "string"
    && Boolean(meal.name.trim())
    && slots.some((slot) => (slot.mealType || slot.id) === normalize(meal.mealType))
    && Number.isFinite(meal.calories) && meal.calories > 0
    && Number.isFinite(meal.protein) && meal.protein >= 0
    && Number.isFinite(meal.carbohydrates) && meal.carbohydrates >= 0
    && Number.isFinite(meal.fat) && meal.fat >= 0
    && Number.isFinite(meal.fiber) && meal.fiber >= 0
    && meal.verificationStatus === "verified"
    && meal.nutritionCoverage === "complete"
    && meal.nutritionComplete === true
    && meal.allergenInformationStatus === "complete"
    && typeof meal.portionSize === "string"
    && Boolean(meal.portionSize.trim())
    && Array.isArray(meal.ingredients)
    && meal.ingredients.length > 0
    && meal.ingredients.every((ingredient) =>
      typeof ingredient === "string"
        ? Boolean(ingredient.trim())
        : ingredient && typeof ingredient.name === "string" && Boolean(ingredient.name.trim())
    )
    && Array.isArray(meal.allergens)
    && meal.allergens.every((allergen) => typeof allergen === "string")
    && Array.isArray(meal.tags)
    && meal.tags.every((tag) => typeof tag === "string")
    && typeof meal.sourceName === "string" && Boolean(meal.sourceName.trim())
    && isValidSourceUrl(meal.sourceUrl);
}

function activityRank(meal, activity) {
  const type = normalize(meal.workoutFocus);
  if (!activity || activity.intensity === "unavailable") return 0;
  if (activity.latestWorkoutType === "strength" && type === "strength") return 2;
  if (activity.intensity === "high" && type === "active-day") return 1;
  return 0;
}

export function recommendMeals({
  source,
  calorieTarget,
  remainingCalories = calorieTarget,
  proteinTarget,
  carbohydrateTarget,
  fatTarget,
  remainingProtein = proteinTarget,
  remainingCarbohydrates = carbohydrateTarget,
  remainingFat = fatTarget,
  diets = [],
  allergies = [],
  preferences = [],
  activity = null,
  consumedMealIds = [],
  consumedMealNames = [],
  slots = defaultMealSlots,
  distributionFromInitial = false,
} = {}) {
  const validSlots = Array.isArray(slots)
    && slots.length > 0
    && slots.every((slot) =>
      slot
      && typeof slot.id === "string"
      && slot.id.trim()
      && typeof slot.label === "string"
      && slot.label.trim()
      && Number.isFinite(slot.calorieShare)
      && slot.calorieShare >= 0
      && (slot.mealType === undefined
        || (typeof slot.mealType === "string" && slot.mealType.trim()))
    );
  const recommendationSlots = validSlots ? slots : defaultMealSlots;
  const emptyResults = () => emptySlots(recommendationSlots);

  if (!validSlots) {
    return {
      status: "unavailable",
      reason: "Meal plan slots or calorie distribution are invalid.",
      meals: emptyResults(),
    };
  }

  if (!Number.isFinite(calorieTarget) || calorieTarget <= 0) {
    return {
      status: "unavailable",
      reason: "A valid daily calorie estimate is required before meals can be portioned.",
      meals: emptyResults(),
    };
  }

  if (!Number.isFinite(remainingCalories) || remainingCalories <= 0) {
    return {
      status: "unavailable",
      reason: "Your estimated calorie target has been reached; no further meal portions are recommended today.",
      meals: emptyResults(),
    };
  }

  if ([remainingProtein, remainingCarbohydrates, remainingFat].some((value) =>
    value === null || (value !== undefined && (!Number.isFinite(value) || value < 0))
  )) {
    return {
      status: "unavailable",
      reason: "Remaining macro targets are unavailable because a logged meal has incomplete nutrition data.",
      meals: emptyResults(),
    };
  }

  if (!source || !Array.isArray(source.meals) || source.meals.length === 0) {
    return {
      status: "unavailable",
      reason: source?.unavailableReason || "No verified nutrition dataset is configured; meal nutrition has not been estimated.",
      meals: emptyResults(),
    };
  }

  const validMeals = source.meals.filter((meal) => isVerifiedMeal(meal, recommendationSlots));
  const idCounts = new Map();
  validMeals.forEach(({ id }) => idCounts.set(id, (idCounts.get(id) || 0) + 1));
  const verifiedMeals = validMeals.filter((meal) => idCounts.get(meal.id) === 1);
  const eligibleMeals = verifiedMeals.filter((meal) =>
    matchesAllergies(meal, allergies)
      && satisfiesPreferences(meal, diets, preferences)
  );
  const loggedMealIds = new Set(
    (Array.isArray(consumedMealIds) ? consumedMealIds : [])
      .filter((id) => typeof id === "string" && id.trim())
      .map((id) => id.trim())
  );
  const loggedMealNames = new Set(
    (Array.isArray(consumedMealNames) ? consumedMealNames : [])
      .filter((name) => typeof name === "string" && name.trim())
      .map(normalize)
  );
  const unloggedMeals = eligibleMeals.filter((meal) =>
    !loggedMealIds.has(meal.id) && !loggedMealNames.has(normalize(meal.name))
  );
  const selectedMealIds = new Set();

  let caloriesLeft = remainingCalories;
  let proteinLeft = Number.isFinite(remainingProtein) ? remainingProtein : Infinity;
  let carbohydratesLeft = Number.isFinite(remainingCarbohydrates) ? remainingCarbohydrates : Infinity;
  let fatLeft = Number.isFinite(remainingFat) ? remainingFat : Infinity;
  const initialBudgets = {
    calories: caloriesLeft,
    protein: proteinLeft,
    carbohydrates: carbohydratesLeft,
    fat: fatLeft,
  };

  const meals = recommendationSlots.map((slot) => {
    if (caloriesLeft <= 0) {
      return { mealType: slot.id, label: slot.label, recommendation: null };
    }

    const calorieAllocation = (distributionFromInitial ? initialBudgets.calories : caloriesLeft)
      * slot.calorieShare;
    const proteinBudget = distributionFromInitial ? initialBudgets.protein : proteinLeft;
    const carbohydrateBudget = distributionFromInitial ? initialBudgets.carbohydrates : carbohydratesLeft;
    const fatBudget = distributionFromInitial ? initialBudgets.fat : fatLeft;
    const proteinAllocation = Number.isFinite(proteinBudget)
      ? proteinBudget * slot.calorieShare
      : null;
    const carbohydrateAllocation = Number.isFinite(carbohydrateBudget)
      ? carbohydrateBudget * slot.calorieShare
      : null;
    const fatAllocation = Number.isFinite(fatBudget)
      ? fatBudget * slot.calorieShare
      : null;
    const candidates = unloggedMeals
      .filter((meal) => normalize(meal.mealType) === (slot.mealType || slot.id))
      .filter((meal) => !selectedMealIds.has(meal.id))
      .filter((meal) =>
        meal.calories <= caloriesLeft
        && meal.protein <= proteinLeft
        && meal.carbohydrates <= carbohydratesLeft
        && meal.fat <= fatLeft
      )
      .map((meal) => ({
        meal,
        score: Math.abs(meal.calories - calorieAllocation)
          / Math.max(calorieAllocation, 1)
          + (proteinAllocation !== null
            ? Math.abs(meal.protein - proteinAllocation) / Math.max(proteinAllocation, 1)
            : 0)
          + (carbohydrateAllocation !== null
            ? Math.abs(meal.carbohydrates - carbohydrateAllocation) / Math.max(carbohydrateAllocation, 1)
            : 0)
          + (fatAllocation !== null
            ? Math.abs(meal.fat - fatAllocation) / Math.max(fatAllocation, 1)
            : 0)
          - (activityRank(meal, activity) * 0.1),
      }))
      .sort((left, right) => left.score - right.score);

    const recommendation = candidates[0]?.meal || null;
    if (recommendation) {
      selectedMealIds.add(recommendation.id);
      caloriesLeft -= recommendation.calories;
      proteinLeft -= recommendation.protein;
      carbohydratesLeft -= recommendation.carbohydrates;
      fatLeft -= recommendation.fat;
    }

    return {
      mealType: slot.id,
      label: slot.label,
      recommendation,
    };
  });

  if (!meals.some((slot) => slot.recommendation)) {
    return {
      status: "unavailable",
      reason: verifiedMeals.length === 0
        ? "The configured food source has no complete, verified nutrition records."
        : eligibleMeals.length === 0
          ? "No verified meals match your selected diet and allergy restrictions."
          : unloggedMeals.length === 0
            ? "All otherwise suitable meals have already been logged today."
          : "No verified meal portions fit your remaining calorie and macronutrient budget.",
      meals,
    };
  }

  return { status: "ready", reason: null, meals };
}
