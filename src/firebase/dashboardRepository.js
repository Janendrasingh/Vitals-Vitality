import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./client.js";

function requireUid(uid) {
  if (typeof uid !== "string" || !uid.trim()) {
    throw new Error("A signed-in user is required to access dashboard records.");
  }
}

function requireDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Dashboard records require a date in YYYY-MM-DD format.");
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("The dashboard record date is invalid.");
  }
}

function stableHash(value) {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

function entryId(kind, entry) {
  if (entry?.id !== null && entry?.id !== undefined && String(entry.id)) {
    return `${kind}-${stableHash(`${kind}:${entry.id}`)}`;
  }
  return `${kind}-${stableHash(`${kind}:${JSON.stringify(entry)}`)}`;
}

export function createDashboardEntryId(kind) {
  const randomId = globalThis.crypto?.randomUUID?.();
  return `${kind}-${randomId || stableHash(`${Date.now()}:${Math.random()}`)}`;
}

function logTimestamp(entry) {
  const timestamp = Number(entry?.time);
  if (Number.isFinite(timestamp) && timestamp > 0) return Math.trunc(timestamp);
  const legacyId = Number(entry?.id);
  return Number.isFinite(legacyId) && legacyId > 0 ? Math.trunc(legacyId) : 0;
}

function normalizeMeal(uid, date, entry) {
  const id = entryId("meal", entry);
  return {
    id,
    uid,
    date,
    name: String(entry?.name || "Meal").trim().slice(0, 120),
    calories: Number(entry?.calories),
    protein: entry?.protein === null || entry?.protein === undefined ? null : Number(entry.protein),
    carbs: entry?.carbs === null || entry?.carbs === undefined ? null : Number(entry.carbs),
    fat: entry?.fat === null || entry?.fat === undefined ? null : Number(entry.fat),
    fiber: entry?.fiber === null || entry?.fiber === undefined ? null : Number(entry.fiber),
    suggested: entry?.suggested === true,
    loggedAt: logTimestamp(entry),
  };
}

function normalizeWorkout(uid, date, entry) {
  const id = entryId("workout", entry);
  return {
    id,
    uid,
    date,
    type: String(entry?.type || "activity").slice(0, 40),
    label: String(entry?.label || "Activity").slice(0, 100),
    minutes: Number(entry?.minutes),
    calories: Number.isFinite(Number(entry?.calories)) ? Number(entry.calories) : null,
    steps: Number.isFinite(Number(entry?.steps)) ? Number(entry.steps) : 0,
    loggedAt: logTimestamp(entry),
  };
}

function normalizeWeight(uid, entry) {
  const id = entryId("weight", entry);
  return {
    id,
    uid,
    weight: Number(entry?.weight),
    loggedAt: logTimestamp(entry),
  };
}

export function createDashboardRepository(database, firestore) {
  function requireDatabase() {
    if (!database) throw new Error("Firebase Firestore is not configured.");
  }

  function userReference(uid) {
    return firestore.doc(database, "users", uid);
  }

  function getDayReference(uid, date) {
    return firestore.doc(userReference(uid), "dashboardDays", date);
  }

  function getMealsReference(uid, date) {
    return firestore.collection(getDayReference(uid, date), "meals");
  }

  function getWorkoutsReference(uid, date) {
    return firestore.collection(getDayReference(uid, date), "manualWorkouts");
  }

  function getWeightEntriesReference(uid) {
    return firestore.collection(userReference(uid), "weightEntries");
  }

  async function ensureDay(uid, date, initial = {}) {
    await firestore.runTransaction(database, async (transaction) => {
      const reference = getDayReference(uid, date);
      const snapshot = await transaction.get(reference);
      const current = snapshot.exists() ? snapshot.data() : {};
      transaction.set(reference, {
        date,
        waterGlasses: Math.min(10, Math.max(
          Number(current.waterGlasses) || 0,
          Number(initial.waterGlasses) || 0
        )),
        steps: Math.max(Number(current.steps) || 0, Number(initial.steps) || 0),
        updatedAt: firestore.serverTimestamp(),
      }, { merge: true });
    });
  }

  async function saveDashboardMeal(uid, date, entry) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    const meal = normalizeMeal(uid, date, entry);
    validateMeal(meal);
    await ensureDay(uid, date);
    await firestore.setDoc(firestore.doc(getMealsReference(uid, date), meal.id), meal);
    return meal;
  }

  async function deleteDashboardMeal(uid, date, mealId) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    if (typeof mealId !== "string" || !mealId.trim() || mealId.length > 200) {
      throw new Error("A valid meal record is required.");
    }
    await firestore.deleteDoc(firestore.doc(getMealsReference(uid, date), mealId));
  }

  async function saveDashboardWorkout(uid, date, entry) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    const workout = normalizeWorkout(uid, date, entry);
    validateWorkout(workout);
    await ensureDay(uid, date);
    await firestore.setDoc(firestore.doc(getWorkoutsReference(uid, date), workout.id), workout);
    return workout;
  }

  async function saveWeightEntry(uid, entry) {
    requireDatabase();
    requireUid(uid);
    const weight = normalizeWeight(uid, entry);
    validateWeight(weight);
    await firestore.setDoc(firestore.doc(getWeightEntriesReference(uid), weight.id), weight);
    return weight;
  }

  async function addWaterGlass(uid, date) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    await firestore.runTransaction(database, async (transaction) => {
      const reference = getDayReference(uid, date);
      const snapshot = await transaction.get(reference);
      const current = snapshot.exists() ? snapshot.data() : {};
      transaction.set(reference, {
        date,
        waterGlasses: Math.min(10, (Number(current.waterGlasses) || 0) + 1),
        steps: Number(current.steps) || 0,
        updatedAt: firestore.serverTimestamp(),
      }, { merge: true });
    });
  }

  async function addManualSteps(uid, date, steps) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    if (!Number.isSafeInteger(steps) || steps < 0 || steps > 100000) {
      throw new Error("Manual steps must be a whole number between 0 and 100000.");
    }
    await firestore.runTransaction(database, async (transaction) => {
      const reference = getDayReference(uid, date);
      const snapshot = await transaction.get(reference);
      const current = snapshot.exists() ? snapshot.data() : {};
      transaction.set(reference, {
        date,
        waterGlasses: Number(current.waterGlasses) || 0,
        steps: (Number(current.steps) || 0) + steps,
        updatedAt: firestore.serverTimestamp(),
      }, { merge: true });
    });
  }

  async function migrateLegacyDashboard(uid, date, legacy) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    await ensureDay(uid, date, legacy);

    const [existingMeals, existingWorkouts, existingWeightEntries] = await Promise.all([
      firestore.getDocs(getMealsReference(uid, date)),
      firestore.getDocs(getWorkoutsReference(uid, date)),
      firestore.getDocs(getWeightEntriesReference(uid)),
    ]);
    const existingMealIds = new Set(existingMeals.docs.map((snapshot) => snapshot.id));
    const existingWorkoutIds = new Set(existingWorkouts.docs.map((snapshot) => snapshot.id));
    const existingWeightIds = new Set(existingWeightEntries.docs.map((snapshot) => snapshot.id));
    const writes = [
      ...(Array.isArray(legacy?.meals) ? legacy.meals : [])
        .map((entry) => normalizeMeal(uid, date, entry))
        .filter((entry) => !existingMealIds.has(entry.id))
        .map((entry) => {
          validateMeal(entry);
          return firestore.setDoc(firestore.doc(getMealsReference(uid, date), entry.id), entry);
        }),
      ...(Array.isArray(legacy?.workouts) ? legacy.workouts : [])
        .map((entry) => normalizeWorkout(uid, date, entry))
        .filter((entry) => !existingWorkoutIds.has(entry.id))
        .map((entry) => {
          validateWorkout(entry);
          return firestore.setDoc(firestore.doc(getWorkoutsReference(uid, date), entry.id), entry);
        }),
      ...(Array.isArray(legacy?.weightEntries) ? legacy.weightEntries : [])
        .map((entry) => normalizeWeight(uid, entry))
        .filter((entry) => !existingWeightIds.has(entry.id))
        .map((entry) => {
          validateWeight(entry);
          return firestore.setDoc(firestore.doc(getWeightEntriesReference(uid), entry.id), entry);
        }),
    ];
    await Promise.all(writes);
  }

  async function loadDashboardSnapshot(uid, date) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    const [daySnapshot, mealSnapshot, workoutSnapshot, weightSnapshot] = await Promise.all([
      firestore.getDoc(getDayReference(uid, date)),
      firestore.getDocs(getMealsReference(uid, date)),
      firestore.getDocs(getWorkoutsReference(uid, date)),
      firestore.getDocs(getWeightEntriesReference(uid)),
    ]);
    return makeDashboardState(
      date,
      daySnapshot.exists() ? daySnapshot.data() : null,
      mealSnapshot.docs.map((snapshot) => snapshot.data()),
      workoutSnapshot.docs.map((snapshot) => snapshot.data()),
      weightSnapshot.docs.map((snapshot) => snapshot.data())
    );
  }

  function subscribeDashboard(uid, date, onChange, onError) {
    requireDatabase();
    requireUid(uid);
    requireDate(date);
    const state = {
      day: null,
      meals: [],
      workouts: [],
      weightEntries: [],
    };
    const emit = () => onChange(makeDashboardState(
      date,
      state.day,
      state.meals,
      state.workouts,
      state.weightEntries
    ));

    const unsubscriptions = [
      firestore.onSnapshot(getDayReference(uid, date), (snapshot) => {
        state.day = snapshot.exists() ? snapshot.data() : null;
        emit();
      }, onError),
      firestore.onSnapshot(getMealsReference(uid, date), (snapshot) => {
        state.meals = snapshot.docs.map((item) => item.data());
        emit();
      }, onError),
      firestore.onSnapshot(getWorkoutsReference(uid, date), (snapshot) => {
        state.workouts = snapshot.docs.map((item) => item.data());
        emit();
      }, onError),
      firestore.onSnapshot(getWeightEntriesReference(uid), (snapshot) => {
        state.weightEntries = snapshot.docs.map((item) => item.data());
        emit();
      }, onError),
    ];
    return () => unsubscriptions.forEach((unsubscribe) => unsubscribe());
  }

  return {
    addManualSteps,
    addWaterGlass,
    deleteDashboardMeal,
    loadDashboardSnapshot,
    migrateLegacyDashboard,
    saveDashboardMeal,
    saveDashboardWorkout,
    saveWeightEntry,
    subscribeDashboard,
  };
}

function makeDashboardState(date, day, meals, workouts, weightEntries) {
  return {
    date,
    meals: meals.sort((left, right) => left.loggedAt - right.loggedAt)
      .map((meal) => ({
        id: meal.id,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber,
        suggested: meal.suggested,
        time: meal.loggedAt,
      })),
    waterGlasses: Math.min(10, Math.max(0, Number(day?.waterGlasses) || 0)),
    weightEntries: weightEntries
      .sort((left, right) => left.loggedAt - right.loggedAt)
      .map((entry) => ({
        id: entry.id,
        weight: entry.weight,
        time: entry.loggedAt,
      })),
    workouts: workouts.sort((left, right) => left.loggedAt - right.loggedAt)
      .map((workout) => ({
        id: workout.id,
        type: workout.type,
        label: workout.label,
        minutes: workout.minutes,
        calories: workout.calories,
        steps: workout.steps,
        time: workout.loggedAt,
      })),
    steps: Math.max(0, Number(day?.steps) || 0),
  };
}

function validateMeal(meal) {
  if (!meal.name || !Number.isFinite(meal.calories) || meal.calories < 0 || meal.calories > 20000) {
    throw new Error("Meal name and a valid calorie value are required.");
  }
  for (const field of ["protein", "carbs", "fat"]) {
    if (meal[field] !== null && (!Number.isFinite(meal[field]) || meal[field] < 0 || meal[field] > 2000)) {
      throw new Error(`Meal ${field} must be a non-negative number.`);
    }
  }
  if (meal.fiber !== null && (!Number.isFinite(meal.fiber) || meal.fiber < 0 || meal.fiber > 2000)) {
    throw new Error("Meal fiber must be a non-negative number.");
  }
}

function validateWorkout(workout) {
  if (!Number.isFinite(workout.minutes) || workout.minutes <= 0 || workout.minutes > 1440
    || !Number.isSafeInteger(workout.steps) || workout.steps < 0 || workout.steps > 100000
    || (workout.calories !== null && (!Number.isFinite(workout.calories) || workout.calories < 0 || workout.calories > 20000))) {
    throw new Error("Activity duration, steps, or calories are invalid.");
  }
}

function validateWeight(entry) {
  if (!Number.isFinite(entry.weight) || entry.weight < 1 || entry.weight > 500) {
    throw new Error("Weight must be between 1 and 500 kg.");
  }
}

const repository = createDashboardRepository(db, {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
});

export const {
  addManualSteps,
  addWaterGlass,
  deleteDashboardMeal,
  loadDashboardSnapshot,
  migrateLegacyDashboard,
  saveDashboardMeal,
  saveDashboardWorkout,
  saveWeightEntry,
  subscribeDashboard,
} = repository;
