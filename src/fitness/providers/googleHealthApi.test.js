import assert from "node:assert/strict";
import test from "node:test";
import { createGoogleHealthProvider } from "./googleHealthApi.js";

function makeResponse(ok, body) {
  return {
    ok,
    json: async () => body,
  };
}

test("starts Google authorization with the user's Firebase ID token", async () => {
  const calls = [];
  const provider = createGoogleHealthProvider({
    baseUrl: "https://example.test/googleHealthApi/",
    getIdToken: async () => "firebase-id-token",
    fetchImpl: async (...args) => {
      calls.push(args);
      return makeResponse(true, { authorizationUrl: "https://accounts.google.com/authorize" });
    },
  });

  const authorizationUrl = await provider.connect();

  assert.equal(provider.id, "google_health");
  assert.equal(authorizationUrl, "https://accounts.google.com/authorize");
  assert.equal(calls[0][0], "https://example.test/googleHealthApi/start");
  assert.equal(calls[0][1].headers.Authorization, "Bearer firebase-id-token");
  assert.equal(JSON.parse(calls[0][1].body).returnUrl, undefined);
});

test("synchronizes and disconnects without exposing a provider access token", async () => {
  const calls = [];
  const provider = createGoogleHealthProvider({
    baseUrl: "https://example.test/googleHealthApi",
    getIdToken: async () => "firebase-id-token",
    fetchImpl: async (...args) => {
      calls.push(args);
      return makeResponse(true, calls.length === 1 ? { daily: [], workouts: [], empty: true } : { status: "disconnected" });
    },
  });

  const synced = await provider.sync({ startDate: "2026-10-24", endDate: "2026-10-30" });
  const disconnected = await provider.disconnect();

  assert.equal(synced.empty, true);
  assert.deepEqual(disconnected, { status: "disconnected" });
  assert.equal(calls[0][0], "https://example.test/googleHealthApi/sync");
  assert.deepEqual(JSON.parse(calls[0][1].body), { startDate: "2026-10-24", endDate: "2026-10-30" });
  assert.equal(calls[1][0], "https://example.test/googleHealthApi/disconnect");
  assert.equal(JSON.stringify(calls).includes("google-access-token"), false);
});

test("surfaces authentication and provider errors", async () => {
  const unauthenticated = createGoogleHealthProvider({
    baseUrl: "https://example.test/googleHealthApi",
    getIdToken: async () => null,
    fetchImpl: async () => makeResponse(true, {}),
  });
  await assert.rejects(unauthenticated.sync({}), { code: "unauthenticated" });

  const denied = createGoogleHealthProvider({
    baseUrl: "https://example.test/googleHealthApi",
    getIdToken: async () => "firebase-id-token",
    fetchImpl: async () => makeResponse(false, {
      code: "permission-denied",
      error: "Google Health denied access.",
    }),
  });
  await assert.rejects(denied.sync({}), {
    code: "permission-denied",
    message: "Google Health denied access.",
  });
});
