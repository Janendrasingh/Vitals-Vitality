import assert from "node:assert/strict";
import test from "node:test";
import { createNutritionPlanRepository } from "./nutritionPlans.js";

function createFirestore() {
  const documents = new Map();
  return {
    documents,
    doc: (...segments) => ({ path: segments.slice(1).join("/") }),
    getDoc: async (reference) => ({
      exists: () => documents.has(reference.path),
      data: () => documents.get(reference.path),
    }),
    setDoc: async (reference, data, options) => {
      const current = documents.get(reference.path) || {};
      documents.set(reference.path, options.merge ? { ...current, ...data } : data);
    },
    serverTimestamp: () => "server-time",
  };
}

const plan = {
  calorieTarget: 2200,
  proteinTarget: 130,
  carbohydrateTarget: 250,
  fatTarget: 70,
  bmr: 1600,
  tdee: 2500,
  goal: "Weight Loss",
};

test("saves and retrieves a plan only inside the requested user's dated subcollection", async () => {
  const firestore = createFirestore();
  const repository = createNutritionPlanRepository({}, firestore);

  await repository.saveNutritionPlan("user-a", "2026-10-30", plan);
  const saved = await repository.loadNutritionPlan("user-a", "2026-10-30");

  assert.deepEqual(saved, {
    ...plan,
    date: "2026-10-30",
    calorieSource: "estimated",
    generatedAt: "server-time",
  });
  assert.equal(firestore.documents.has("users/user-a/nutritionPlans/2026-10-30"), true);
  assert.equal(firestore.documents.has("users/user-b/nutritionPlans/2026-10-30"), false);
});

test("merges plan fields without replacing unrelated existing document data", async () => {
  const firestore = createFirestore();
  firestore.documents.set("users/user-a/nutritionPlans/2026-10-30", { notes: "keep this" });
  const repository = createNutritionPlanRepository({}, firestore);

  await repository.saveNutritionPlan("user-a", "2026-10-30", plan);

  assert.equal(firestore.documents.get("users/user-a/nutritionPlans/2026-10-30").notes, "keep this");
});

test("rejects missing users, invalid dates, and invalid targets", async () => {
  const repository = createNutritionPlanRepository({}, createFirestore());

  await assert.rejects(() => repository.loadNutritionPlan("", "2026-10-30"), /signed-in user/);
  await assert.rejects(() => repository.loadNutritionPlan("user-a", "2026-02-30"), /date is invalid/);
  await assert.rejects(
    () => repository.saveNutritionPlan("user-a", "2026-10-30", { ...plan, proteinTarget: 0 }),
    /proteinTarget/
  );
});
