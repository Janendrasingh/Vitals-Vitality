import assert from "node:assert/strict";
import test from "node:test";
import { createDashboardRepository } from "./dashboardRepository.js";

function createMemoryFirestore() {
  const records = new Map();
  const listeners = new Map();
  const database = {};

  function getPath(reference) {
    return typeof reference === "string" ? reference : reference.path;
  }

  function reference(...parts) {
    const [parent, ...segments] = parts;
    return {
      path: [getPath(parent), ...segments].filter(Boolean).join("/"),
    };
  }

  function makeSnapshot(path, data) {
    return {
      id: path.split("/").at(-1),
      exists: () => data !== undefined,
      data: () => data,
      docs: data || [],
    };
  }

  function snapshotForCollection(collectionReference) {
    const prefix = `${collectionReference.path}/`;
    const docs = [...records.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes("/"))
      .map(([path, data]) => makeSnapshot(path, data));
    return { docs };
  }

  function notify(path) {
    for (const [listenedPath, callbacks] of listeners) {
      if (path === listenedPath || path.startsWith(`${listenedPath}/`) || listenedPath.startsWith(`${path}/`)) {
        callbacks.forEach((callback) => {
          if (listenedPath.endsWith("/meals") || listenedPath.endsWith("/manualWorkouts")
            || listenedPath.endsWith("/weightEntries")) {
            callback(snapshotForCollection({ path: listenedPath }));
          } else {
            callback(makeSnapshot(listenedPath, records.get(listenedPath)));
          }
        });
      }
    }
  }

  const firestore = {
    collection: (parent, ...segments) => reference(parent, ...segments),
    deleteDoc: async (target) => {
      records.delete(target.path);
      notify(target.path);
    },
    doc: (parent, ...segments) => reference(parent, ...segments),
    getDoc: async (target) => makeSnapshot(target.path, records.get(target.path)),
    getDocs: async (target) => snapshotForCollection(target),
    onSnapshot: (target, next, error) => {
      const callbacks = listeners.get(target.path) || [];
      callbacks.push(next);
      listeners.set(target.path, callbacks);
      queueMicrotask(() => {
        try {
          if (target.path.split("/").length % 2 === 0) {
            next(makeSnapshot(target.path, records.get(target.path)));
          } else {
            next(snapshotForCollection(target));
          }
        } catch (caught) {
          error(caught);
        }
      });
      return () => listeners.set(target.path, (listeners.get(target.path) || []).filter((item) => item !== next));
    },
    runTransaction: async (_database, callback) => {
      const writes = [];
      const transaction = {
        get: async (target) => makeSnapshot(target.path, records.get(target.path)),
        set: (target, data, options) => writes.push({ target, data, options }),
      };
      await callback(transaction);
      writes.forEach(({ target, data, options }) => {
        const current = records.get(target.path) || {};
        records.set(target.path, options?.merge ? { ...current, ...data } : data);
        notify(target.path);
      });
    },
    serverTimestamp: () => "server-time",
    setDoc: async (target, data, options) => {
      const current = records.get(target.path) || {};
      records.set(target.path, options?.merge ? { ...current, ...data } : data);
      notify(target.path);
    },
  };

  return {
    database,
    firestore,
    records,
  };
}

test("migrates existing local records idempotently and scopes them to each user", async () => {
  const { database, firestore, records } = createMemoryFirestore();
  const repository = createDashboardRepository(database, firestore);
  const localRecords = {
    date: "2026-10-30",
    meals: [{ id: 1001, name: "Breakfast", calories: 420, protein: 22, carbs: 48, fat: 12, time: 1001 }],
    waterGlasses: 3,
    weightEntries: [{ weight: 67.5, time: 900 }],
    workouts: [{ id: 1002, type: "walking", label: "Walking", minutes: 25, calories: 100, steps: 500, time: 1002 }],
    steps: 500,
  };

  await repository.migrateLegacyDashboard("user-a", "2026-10-30", localRecords);
  const mealPath = [...records.keys()].find((path) => path.startsWith("users/user-a/dashboardDays/2026-10-30/meals/"));
  records.set(mealPath, { ...records.get(mealPath), name: "Cloud copy" });
  await repository.migrateLegacyDashboard("user-a", "2026-10-30", localRecords);
  await repository.migrateLegacyDashboard("user-b", "2026-10-30", localRecords);

  assert.equal(records.size, 8);
  const userARecords = [...records.entries()].filter(([path]) => path.startsWith("users/user-a/"));
  const userBRecords = [...records.entries()].filter(([path]) => path.startsWith("users/user-b/"));
  assert.equal(userARecords.length, 4);
  assert.equal(userBRecords.length, 4);
  assert.ok(userARecords.every(([, record]) => record.uid === "user-a" || record.date === "2026-10-30"));

  const dashboard = await repository.loadDashboardSnapshot("user-a", "2026-10-30");
  assert.equal(dashboard.meals.length, 1);
  assert.equal(dashboard.meals[0].name, "Cloud copy");
  assert.equal(dashboard.workouts.length, 1);
  assert.equal(dashboard.weightEntries.length, 1);
  assert.equal(dashboard.waterGlasses, 3);
  assert.equal(dashboard.steps, 500);
});

test("saves user-scoped entries, preserves cloud day values, and increments water transactionally", async () => {
  const { database, firestore, records } = createMemoryFirestore();
  const repository = createDashboardRepository(database, firestore);
  await repository.migrateLegacyDashboard("user-a", "2026-10-30", {
    waterGlasses: 9,
    steps: 1200,
    meals: [],
    workouts: [],
    weightEntries: [],
  });
  await repository.addWaterGlass("user-a", "2026-10-30");
  await repository.addManualSteps("user-a", "2026-10-30", 300);
  await repository.saveDashboardMeal("user-a", "2026-10-30", {
    id: "meal-entry",
    name: "Lunch",
    calories: 550,
    protein: 35,
    carbs: 50,
    fat: 18,
    fiber: 8,
    time: 2000,
  });

  const day = records.get("users/user-a/dashboardDays/2026-10-30");
  assert.equal(day.waterGlasses, 10);
  assert.equal(day.steps, 1500);
  const mealRecord = [...records.entries()].find(([path]) => path.includes("/meals/"));
  assert.equal(mealRecord[1].uid, "user-a");
  assert.equal(mealRecord[1].fiber, 8);

  await repository.deleteDashboardMeal("user-a", "2026-10-30", mealRecord[1].id);
  assert.equal(records.has(mealRecord[0]), false);
  await assert.rejects(repository.deleteDashboardMeal("user-b", "2026-10-30", ""), /valid meal record/);
});

test("rejects missing users, invalid dates, and invalid activity data", async () => {
  const { database, firestore } = createMemoryFirestore();
  const repository = createDashboardRepository(database, firestore);

  await assert.rejects(repository.loadDashboardSnapshot("", "2026-10-30"), /signed-in user is required/);
  await assert.rejects(repository.addWaterGlass("user-a", "2026-02-30"), /date is invalid/);
  await assert.rejects(repository.addManualSteps("user-a", "2026-10-30", -1), /whole number/);
  await assert.rejects(repository.saveDashboardMeal("user-a", "2026-10-30", {
    name: "Invalid",
    calories: Number.NaN,
  }), /valid calorie value/);
});

test("subscribes to user-scoped records and can unsubscribe", async () => {
  const { database, firestore } = createMemoryFirestore();
  const repository = createDashboardRepository(database, firestore);
  const updates = [];
  const unsubscribe = repository.subscribeDashboard(
    "user-a",
    "2026-10-30",
    (dashboard) => updates.push(dashboard),
    (error) => { throw error; }
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  unsubscribe();

  assert.ok(updates.length > 0);
  assert.ok(updates.every((dashboard) => dashboard.date === "2026-10-30"));
});
