import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./client.js";

const validGoals = new Set(["Weight Loss", "Muscle Gain", "Maintenance"]);

function requireUid(uid) {
  if (typeof uid !== "string" || !uid.trim()) {
    throw new Error("A signed-in user is required to access nutrition plans.");
  }
}

function requireDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Nutrition plans require a date in YYYY-MM-DD format.");
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("The nutrition plan date is invalid.");
  }
}

function validatePlan(plan) {
  if (!plan || !validGoals.has(plan.goal)) {
    throw new Error("Nutrition plan goal is invalid.");
  }
  for (const field of [
    "calorieTarget",
    "proteinTarget",
    "carbohydrateTarget",
    "fatTarget",
    "bmr",
    "tdee",
  ]) {
    if (!Number.isFinite(plan[field]) || plan[field] <= 0) {
      throw new Error(`Nutrition plan ${field} must be a positive number.`);
    }
  }
}

export function createNutritionPlanRepository(database, firestore) {
  function requireDatabase() {
    if (!database) throw new Error("Firebase Firestore is not configured.");
  }

  async function loadNutritionPlan(uid, date) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    const reference = firestore.doc(database, "users", uid, "nutritionPlans", date);
    const snapshot = await firestore.getDoc(reference);
    return snapshot.exists() ? snapshot.data() : null;
  }

  async function saveNutritionPlan(uid, date, plan) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    validatePlan(plan);
    const reference = firestore.doc(database, "users", uid, "nutritionPlans", date);
    const savedPlan = {
      date,
      calorieTarget: Math.round(plan.calorieTarget),
      proteinTarget: Math.round(plan.proteinTarget),
      carbohydrateTarget: Math.round(plan.carbohydrateTarget),
      fatTarget: Math.round(plan.fatTarget),
      bmr: Math.round(plan.bmr),
      tdee: Math.round(plan.tdee),
      goal: plan.goal,
      calorieSource: "estimated",
      generatedAt: firestore.serverTimestamp(),
    };
    await firestore.setDoc(reference, savedPlan, { merge: true });
    return savedPlan;
  }

  return { loadNutritionPlan, saveNutritionPlan };
}

const repository = createNutritionPlanRepository(db, {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
});

export const loadNutritionPlan = repository.loadNutritionPlan;
export const saveNutritionPlan = repository.saveNutritionPlan;
