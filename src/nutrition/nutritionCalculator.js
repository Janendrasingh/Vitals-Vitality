const activityMultipliers = {
  Sedentary: 1.2,
  Moderate: 1.55,
  "Very Active": 1.725,
};

const goalNames = {
  "Weight Loss": "Weight Loss",
  "Muscle Gain": "Muscle Gain",
  Maintenance: "Maintenance",
  "Weight Maintenance": "Maintenance",
};

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function unavailable(error) {
  return {
    available: false,
    error,
    bmr: null,
    tdee: null,
    calorieTarget: null,
    proteinTarget: null,
    carbohydrateTarget: null,
    fatTarget: null,
    macroCalories: null,
    activityMultiplier: null,
  };
}

export function calculateNutritionTargets(profile) {
  if (!profile || typeof profile !== "object") {
    return unavailable("Complete your profile to calculate nutrition estimates.");
  }

  const weight = parseNumber(profile.weight);
  const height = parseNumber(profile.height);
  const age = parseNumber(profile.age);

  if (weight === null || height === null || age === null) {
    return unavailable("Enter your age, weight, and height to calculate nutrition estimates.");
  }
  if (weight < 25 || weight > 350) {
    return unavailable("Weight must be between 25 and 350 kg for this estimate.");
  }
  if (height < 90 || height > 250) {
    return unavailable("Height must be between 90 and 250 cm for this estimate.");
  }
  if (!Number.isInteger(age) || age < 18 || age > 100) {
    return unavailable("This adult estimate requires an age from 18 to 100 years.");
  }

  const gender = typeof profile.gender === "string" ? profile.gender.trim() : "";
  if (gender !== "Male" && gender !== "Female") {
    return unavailable("Select Male or Female for the Mifflin–St Jeor estimate; no value is assumed.");
  }

  const activityMultiplier = typeof profile.activity === "string"
    && Object.hasOwn(activityMultipliers, profile.activity)
    ? activityMultipliers[profile.activity]
    : null;
  if (activityMultiplier === null) {
    return unavailable("Select a supported activity level to calculate your estimate.");
  }

  const goal = typeof profile.goal === "string" && Object.hasOwn(goalNames, profile.goal)
    ? goalNames[profile.goal]
    : null;
  if (goal === null) {
    return unavailable("Select Weight Loss, Muscle Gain, or Maintenance as your goal.");
  }

  const bmr = Math.round(
    (10 * weight) +
    (6.25 * height) -
    (5 * age) +
    (gender === "Male" ? 5 : -161)
  );
  const tdee = Math.round(bmr * activityMultiplier);
  let calorieTarget = tdee;

  if (goal === "Weight Loss") {
    calorieTarget = Math.max(bmr, tdee - Math.min(500, Math.round(tdee * 0.2)));
  } else if (goal === "Muscle Gain") {
    calorieTarget = tdee + Math.min(300, Math.round(tdee * 0.1));
  }

  const proteinPerKg = goal === "Muscle Gain" ? 1.8 : goal === "Weight Loss" ? 1.6 : 1.2;
  const proteinTarget = Math.round(
    Math.min(weight * proteinPerKg, (calorieTarget * 0.35) / 4)
  );
  const fatTarget = Math.round((calorieTarget * 0.3) / 9);
  const carbohydrateTarget = Math.max(
    0,
    Math.round((calorieTarget - (proteinTarget * 4) - (fatTarget * 9)) / 4)
  );
  const macroCalories = (proteinTarget * 4) + (carbohydrateTarget * 4) + (fatTarget * 9);

  return {
    available: true,
    error: null,
    goal,
    bmr,
    tdee,
    calorieTarget,
    proteinTarget,
    carbohydrateTarget,
    fatTarget,
    macroCalories,
    activityMultiplier,
  };
}
