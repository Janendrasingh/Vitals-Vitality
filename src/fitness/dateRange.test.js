import assert from "node:assert/strict";
import test from "node:test";
import { getSyncDateRange } from "./dateRange.js";

test("uses a seven-day local-date range for initial and manual sync", () => {
  assert.deepEqual(getSyncDateRange(new Date(2026, 9, 30, 12)), {
    startDate: "2026-10-24",
    endDate: "2026-10-30",
  });
});
