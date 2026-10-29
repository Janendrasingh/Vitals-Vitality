import { createHash } from "node:crypto";

export const googleHealthProviderId = "google_health";
export const googleHealthPermissions = ["activity_and_fitness.readonly"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeGoogleHealthData(dataPointsByType, { startDate, endDate }) {
  const dailyByDate = new Map();
  for (const date of enumerateDates(startDate, endDate)) {
    dailyByDate.set(date, {
      date,
      provider: googleHealthProviderId,
      steps: null,
      activeCaloriesKcal: null,
      workoutDurationMinutes: null,
      distanceMeters: null,
      averageHeartRateBpm: null,
    });
  }

  aggregateMetricPoints(dataPointsByType.steps || [], "steps", dailyByDate, "steps");
  aggregateMetricPoints(dataPointsByType.distance || [], "distance", dailyByDate, "distanceMeters");
  aggregateMetricPoints(
    dataPointsByType["active-energy-burned"] || [],
    "activeEnergyBurned",
    dailyByDate,
    "activeCaloriesKcal"
  );

  const uniqueWorkouts = new Map();
  for (const point of dataPointsByType.exercise || []) {
    const interval = point?.exercise?.interval;
    const startTimeMs = Date.parse(interval?.startTime || "");
    const endTimeMs = Date.parse(interval?.endTime || "");
    const date = getDateKey(interval);
    if (!date || !Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs)
      || endTimeMs <= startTimeMs) continue;

    const exercise = point.exercise;
    const activityType = typeof exercise.exerciseType === "string"
      ? exercise.exerciseType.toLowerCase().replaceAll("_", " ").slice(0, 80)
      : "unknown";
    const sourceId = typeof point.name === "string" && point.name
      ? point.name
      : createHash("sha256")
        .update(`${startTimeMs}:${endTimeMs}:${activityType}:${exercise.displayName || ""}`)
        .digest("hex");
    const metrics = exercise.metricsSummary || {};
    uniqueWorkouts.set(sourceId, {
      id: sourceId,
      date,
      activityType,
      startTimeMs,
      endTimeMs,
      durationMinutes: Math.max(0, Math.round((endTimeMs - startTimeMs) / 60000)),
      activeCaloriesKcal: null,
      distanceMeters: finiteNonNegative(metrics.distanceMillimeters)
        ? Number(metrics.distanceMillimeters) / 1000
        : null,
      averageHeartRateBpm: finiteNonNegative(metrics.averageHeartRateBeatsPerMinute)
        ? Number(metrics.averageHeartRateBeatsPerMinute)
        : null,
    });
  }

  const workouts = [...uniqueWorkouts.values()];
  const workoutsByDate = new Map();
  for (const workout of workouts) {
    const dateWorkouts = workoutsByDate.get(workout.date) || [];
    dateWorkouts.push(workout);
    workoutsByDate.set(workout.date, dateWorkouts);
  }

  for (const [date, dateWorkouts] of workoutsByDate) {
    const daily = dailyByDate.get(date);
    if (daily) daily.workoutDurationMinutes = unionDurationMinutes(dateWorkouts);
  }

  return {
    daily: [...dailyByDate.values()],
    workouts: workouts.sort((left, right) => left.startTimeMs - right.startTimeMs),
  };
}

export function createWorkoutDocumentId(providerId, sourceWorkoutId) {
  return createHash("sha256").update(`${providerId}:${sourceWorkoutId}`).digest("hex");
}

export async function persistGoogleHealthSync(db, fieldValue, uid, normalized) {
  if (!uid || !Array.isArray(normalized.daily) || !Array.isArray(normalized.workouts)) {
    throw new Error("The authenticated user or normalized Google Health data is invalid.");
  }

  const userPath = `users/${uid}`;
  const writes = [
    ...normalized.daily.map((daily) => ({
      reference: db.doc(`${userPath}/fitnessDaily/${daily.date}`),
      data: { uid, ...daily, syncedAt: fieldValue.serverTimestamp() },
    })),
    ...normalized.workouts.map((workout) => ({
      reference: db.doc(`${userPath}/workouts/${createWorkoutDocumentId(googleHealthProviderId, workout.id)}`),
      data: {
        uid,
        provider: googleHealthProviderId,
        sourceWorkoutId: workout.id,
        date: workout.date,
        activityType: workout.activityType,
        startTimeMs: workout.startTimeMs,
        endTimeMs: workout.endTimeMs,
        durationMinutes: workout.durationMinutes,
        activeCaloriesKcal: workout.activeCaloriesKcal,
        distanceMeters: workout.distanceMeters,
        averageHeartRateBpm: workout.averageHeartRateBpm,
        syncedAt: fieldValue.serverTimestamp(),
      },
    })),
  ];

  for (let offset = 0; offset < writes.length; offset += 400) {
    const batch = db.batch();
    for (const write of writes.slice(offset, offset + 400)) {
      batch.set(write.reference, write.data);
    }
    await batch.commit();
  }

  await db.doc(`${userPath}/integrations/${googleHealthProviderId}`).set({
    uid,
    providerId: googleHealthProviderId,
    status: "connected",
    permissions: googleHealthPermissions,
    lastSyncAt: fieldValue.serverTimestamp(),
    updatedAt: fieldValue.serverTimestamp(),
  }, { merge: true });
}

function aggregateMetricPoints(points, valueField, dailyByDate, targetField) {
  const seen = new Set();
  for (const point of points) {
    const metric = point?.[valueField];
    const interval = metric?.interval;
    const date = getDateKey(interval);
    const rawValue = valueField === "steps" ? metric?.count
      : valueField === "distance" ? metric?.millimeters
        : metric?.kcal;
    if (!date || !dailyByDate.has(date) || !finiteNonNegative(rawValue)) continue;

    const start = interval?.startTime || "";
    const end = interval?.endTime || "";
    const key = `${date}:${start}:${end}:${rawValue}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const value = valueField === "distance" ? Number(rawValue) / 1000
      : valueField === "steps" ? Math.round(Number(rawValue))
        : Number(rawValue);
    const daily = dailyByDate.get(date);
    daily[targetField] = (daily[targetField] ?? 0) + value;
  }
}

function getDateKey(interval) {
  const civilDate = interval?.civilStartTime?.date;
  if (civilDate && Number.isInteger(civilDate.year)
    && Number.isInteger(civilDate.month) && Number.isInteger(civilDate.day)) {
    return `${civilDate.year}-${String(civilDate.month).padStart(2, "0")}-${String(civilDate.day).padStart(2, "0")}`;
  }

  const startTime = Date.parse(interval?.startTime || "");
  return Number.isFinite(startTime) ? new Date(startTime).toISOString().slice(0, 10) : null;
}

function enumerateDates(startDate, endDate) {
  if (!isDateKey(startDate) || !isDateKey(endDate) || startDate > endDate) {
    throw new Error("The requested Google Health date range is invalid.");
  }

  const dates = [];
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  for (let cursor = Date.parse(`${startDate}T00:00:00.000Z`); cursor <= end; cursor += DAY_MS) {
    dates.push(new Date(cursor).toISOString().slice(0, 10));
  }
  if (dates.length > 31) throw new Error("The requested Google Health date range is too large.");
  return dates;
}

function isDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function finiteNonNegative(value) {
  return value !== null && value !== undefined && value !== ""
    && Number.isFinite(Number(value)) && Number(value) >= 0;
}

function unionDurationMinutes(workouts) {
  const intervals = workouts
    .map(({ startTimeMs, endTimeMs }) => ({ startTimeMs, endTimeMs }))
    .sort((left, right) => left.startTimeMs - right.startTimeMs);
  const merged = [];
  for (const interval of intervals) {
    const previous = merged.at(-1);
    if (!previous || interval.startTimeMs >= previous.endTimeMs) {
      merged.push({ ...interval });
    } else {
      previous.endTimeMs = Math.max(previous.endTimeMs, interval.endTimeMs);
    }
  }
  return Math.round(merged.reduce(
    (total, interval) => total + interval.endTimeMs - interval.startTimeMs,
    0
  ) / 60000);
}
