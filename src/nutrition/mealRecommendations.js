const mealSlots = [
  { id: "breakfast", label: "Breakfast", calorieShare: 0.25 },
  { id: "lunch", label: "Lunch", calorieShare: 0.3 },
  { id: "evening-snacks", label: "Evening Snacks", calorieShare: 0.1 },
  { id: "dinner", label: "Dinner", calorieShare: 0.35 },
];

function emptySlots() {
  return mealSlots.map((slot) => ({
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

function matchesAllergies(meal, allergies) {
  const declaredAllergens = Array.isArray(meal.allergens)
    ? meal.allergens.map(normalize)
    : null;
  const ingredients = Array.isArray(meal.ingredients)
    ? meal.ingredients.map((ingredient) => normalize(ingredient.name || ingredient))
    : [];

  if (!declaredAllergens) return false;
  return allergies.every((allergyValue) => {
    const allergy = normalize(allergyValue);
    if (!allergy) return true;
    const category = Object.entries(knownAllergyAliases).find(([, aliases]) =>
      aliases.some((alias) => allergy.includes(alias))
    )?.[0];
    if (!category) return false;
    const aliases = knownAllergyAliases[category];
    return !declaredAllergens.some((item) =>
      item === category || aliases.some((alias) => item.includes(alias))
    ) && !ingredients.some((item) => aliases.some((alias) => item.includes(alias)));
  });
}

function satisfiesPreferences(meal, diets, preferences) {
  const tags = Array.isArray(meal.tags) ? meal.tags.map(normalize) : [];
  const ingredients = Array.isArray(meal.ingredients)
    ? meal.ingredients.map((ingredient) => normalize(ingredient.name || ingredient))
    : [];

  const meetsDiets = diets.every((dietValue) => {
    const diet = normalize(dietValue);
    const key = dietAliases[diet.replace(/\s+/g, "-")] || diet.replace(/\s+/g, "-");
    return tags.includes(key);
  });
  const meetsFoodPreferences = preferences.every((preferenceValue) => {
    const preference = normalize(preferenceValue);
    return !preference || tags.includes(preference) || ingredients.some((item) => item.includes(preference));
  });

  return meetsDiets && meetsFoodPreferences;
}

function isVerifiedMeal(meal) {
  const sourceUrlIsValid = typeof meal?.sourceUrl === "string"
    && /^https:\/\/\S+$/i.test(meal.sourceUrl);
  return meal
    && typeof meal.id === "string"
    && typeof meal.name === "string"
    && mealSlots.some((slot) => slot.id === normalize(meal.mealType))
    && Number.isFinite(meal.calories) && meal.calories > 0
    && Number.isFinite(meal.protein) && meal.protein >= 0
    && Number.isFinite(meal.carbohydrates) && meal.carbohydrates >= 0
    && Number.isFinite(meal.fat) && meal.fat >= 0
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
    && sourceUrlIsValid;
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
  proteinTarget,
  carbohydrateTarget,
  fatTarget,
  diets = [],
  allergies = [],
  preferences = [],
  activity = null,
} = {}) {
  if (!Number.isFinite(calorieTarget) || calorieTarget <= 0) {
    return {
      status: "unavailable",
      reason: "A valid daily calorie estimate is required before meals can be portioned.",
      meals: emptySlots(),
    };
  }

  if (!source || !Array.isArray(source.meals) || source.meals.length === 0) {
    return {
      status: "unavailable",
      reason: source?.unavailableReason || "No verified nutrition dataset is configured; meal nutrition has not been estimated.",
      meals: emptySlots(),
    };
  }

  const verifiedMeals = source.meals.filter(isVerifiedMeal);
  const eligibleMeals = verifiedMeals.filter((meal) =>
    matchesAllergies(meal, allergies)
      && satisfiesPreferences(meal, diets, preferences)
  );

  const meals = mealSlots.map((slot) => {
    const candidates = eligibleMeals
      .filter((meal) => normalize(meal.mealType) === slot.id)
      .map((meal) => ({
        meal,
        score: Math.abs(meal.calories - (calorieTarget * slot.calorieShare))
          / Math.max(calorieTarget * slot.calorieShare, 1)
          + (Number.isFinite(proteinTarget)
            ? Math.abs(meal.protein - (proteinTarget * slot.calorieShare)) / Math.max(proteinTarget * slot.calorieShare, 1)
            : 0)
          + (Number.isFinite(carbohydrateTarget)
            ? Math.abs(meal.carbohydrates - (carbohydrateTarget * slot.calorieShare)) / Math.max(carbohydrateTarget * slot.calorieShare, 1)
            : 0)
          + (Number.isFinite(fatTarget)
            ? Math.abs(meal.fat - (fatTarget * slot.calorieShare)) / Math.max(fatTarget * slot.calorieShare, 1)
            : 0)
          - (activityRank(meal, activity) * 0.1),
      }))
      .sort((left, right) => left.score - right.score);

    return {
      mealType: slot.id,
      label: slot.label,
      recommendation: candidates[0]?.meal || null,
    };
  });

  if (!meals.some((slot) => slot.recommendation)) {
    return {
      status: "unavailable",
      reason: verifiedMeals.length
        ? "No verified meals match your selected diet and allergy restrictions."
        : "The configured food source has no complete, verified nutrition records.",
      meals,
    };
  }

  return { status: "ready", reason: null, meals };
}
