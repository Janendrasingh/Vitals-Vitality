import assert from "node:assert/strict";
import test from "node:test";
import {
  createWorkoutDocumentId,
  normalizeGoogleHealthData,
  persistGoogleHealthSync,
} from "./fitnessData.js";

const interval = (startTime, endTime, date = "2026-10-30") => ({
  startTime,
  endTime,
  civilStartTime: {
    date: {
      year: Number(date.slice(0, 4)),
      month: Number(date.slice(5, 7)),
      day: Number(date.slice(8, 10)),
    },
  },
});

test("normalizes Google Health metrics and preserves unavailable values", () => {
  const normalized = normalizeGoogleHealthData({
    steps: [{
      steps: { count: "8500", interval: interval("2026-10-30T06:00:00Z", "2026-10-30T07:00:00Z") },
    }],
    "active-energy-burned": [{
      activeEnergyBurned: { kcal: 320, interval: interval("2026-10-30T06:00:00Z", "2026-10-30T07:00:00Z") },
    }],
    distance: [{
      distance: { millimeters: "4200000", interval: interval("2026-10-30T06:00:00Z", "2026-10-30T07:00:00Z") },
    }],
    exercise: [{
      name: "users/me/dataTypes/exercise/dataPoints/run-1",
      exercise: {
        exerciseType: "RUNNING",
        interval: interval("2026-10-30T06:00:00Z", "2026-10-30T06:45:00Z"),
        metricsSummary: { distanceMillimeters: 4000000, averageHeartRateBeatsPerMinute: "142" },
      },
    }],
  }, { startDate: "2026-10-30", endDate: "2026-10-30" });

  assert.deepEqual(normalized.daily[0], {
    date: "2026-10-30",
    provider: "google_health",
    steps: 8500,
    activeCaloriesKcal: 320,
    workoutDurationMinutes: 45,
    distanceMeters: 4200,
    averageHeartRateBpm: null,
  });
  assert.equal(normalized.workouts[0].distanceMeters, 4000);
  assert.equal(normalized.workouts[0].averageHeartRateBpm, 142);
  assert.equal(normalized.workouts[0].activeCaloriesKcal, null);
});

test("deduplicates duplicate points and overlapping workouts", () => {
  const repeatedSteps = {
    steps: { count: "1000", interval: interval("2026-10-30T06:00:00Z", "2026-10-30T07:00:00Z") },
  };
  const workouts = [
    ["run-1", "2026-10-30T06:00:00Z", "2026-10-30T06:45:00Z"],
    ["run-2", "2026-10-30T06:30:00Z", "2026-10-30T07:00:00Z"],
  ].map(([id, start, end]) => ({
    name: id,
    exercise: {
      exerciseType: "RUNNING",
      interval: interval(start, end),
      metricsSummary: {},
    },
  }));
  const normalized = normalizeGoogleHealthData({
    steps: [repeatedSteps, repeatedSteps],
    exercise: workouts,
  }, { startDate: "2026-10-30", endDate: "2026-10-30" });

  assert.equal(normalized.daily[0].steps, 1000);
  assert.equal(normalized.daily[0].workoutDurationMinutes, 60);
});

test("keeps unavailable metrics null and validates requested date ranges", () => {
  const normalized = normalizeGoogleHealthData({}, {
    startDate: "2026-10-29",
    endDate: "2026-10-30",
  });
  assert.equal(normalized.daily.length, 2);
  assert.equal(normalized.daily[0].steps, null);
  assert.equal(normalized.daily[0].activeCaloriesKcal, null);
  assert.throws(
    () => normalizeGoogleHealthData({}, { startDate: "2026-10-30", endDate: "2026-10-01" }),
    /date range is invalid/
  );
});

test("uses deterministic workout IDs and persists only in the authenticated user subtree", async () => {
  const docs = new Map();
  const db = {
    doc: (path) => ({
      path,
      set: async (data, options = {}) => {
        docs.set(path, options.merge ? { ...(docs.get(path) || {}), ...data } : data);
      },
    }),
    batch: () => {
      const writes = [];
      return {
        set: (reference, data) => writes.push({ reference, data }),
        commit: async () => writes.forEach(({ reference, data }) => docs.set(reference.path, data)),
      };
    },
  };
  const fieldValue = { serverTimestamp: () => "server-time" };
  const normalized = normalizeGoogleHealthData({
    exercise: [{
      name: "run-1",
      exercise: {
        exerciseType: "RUNNING",
        interval: interval("2026-10-30T06:00:00Z", "2026-10-30T06:45:00Z"),
        metricsSummary: {},
      },
    }],
  }, { startDate: "2026-10-30", endDate: "2026-10-30" });

  await persistGoogleHealthSync(db, fieldValue, "user-a", normalized);
  await persistGoogleHealthSync(db, fieldValue, "user-a", normalized);

  const workoutPath = `users/user-a/workouts/${createWorkoutDocumentId("google_health", "run-1")}`;
  assert.equal([...docs.keys()].filter((path) => path === workoutPath).length, 1);
  assert.equal([...docs.keys()].every((path) => path.startsWith("users/user-a/")), true);
  assert.equal(docs.get("users/user-a/fitnessDaily/2026-10-30").syncedAt, "server-time");
  assert.equal(docs.get("users/user-a/integrations/google_health").status, "connected");
});
