import assert from "node:assert/strict";
import test from "node:test";
import {
  exchangeGoogleAuthorizationCode,
  GoogleHealthClientError,
  readGoogleHealthActivity,
  refreshGoogleHealthAccessToken,
  revokeGoogleHealthToken,
} from "./googleHealthClient.js";

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("exchanges authorization codes with a server-only client secret", async () => {
  let request;
  const tokens = await exchangeGoogleAuthorizationCode({
    code: "authorization-code",
    clientId: "client-id",
    clientSecret: "private-secret",
    redirectUri: "https://example.test/callback",
    fetchImpl: async (...args) => {
      request = args;
      return response(200, { refresh_token: "refresh-token" });
    },
  });

  assert.equal(tokens.refresh_token, "refresh-token");
  assert.equal(request[0], "https://oauth2.googleapis.com/token");
  assert.equal(request[1].body.get("client_secret"), "private-secret");
  assert.equal(request[1].body.get("redirect_uri"), "https://example.test/callback");
});

test("reads paginated activity data with date filters for supported metrics", async () => {
  const requests = [];
  const data = await readGoogleHealthActivity({
    accessToken: "short-lived-access-token",
    startDate: "2026-10-24",
    endDate: "2026-10-30",
    fetchImpl: async (url, options) => {
      const parsed = new URL(url);
      requests.push({ parsed, options });
      if (parsed.pathname.endsWith("/exercise/dataPoints") && !parsed.searchParams.has("pageToken")) {
        return response(200, { dataPoints: [{ name: "workout-1" }], nextPageToken: "next" });
      }
      if (parsed.pathname.endsWith("/exercise/dataPoints")) {
        return response(200, { dataPoints: [{ name: "workout-2" }] });
      }
      return response(200, { dataPoints: [] });
    },
  });

  assert.deepEqual(Object.keys(data).sort(), ["active-energy-burned", "distance", "exercise", "steps"]);
  assert.equal(data.exercise.length, 2);
  assert.equal(data.steps.length, 0);
  assert.equal(requests.length, 5);
  const stepsRequest = requests.find(({ parsed }) => parsed.pathname.endsWith("/steps/dataPoints"));
  assert.match(stepsRequest.parsed.searchParams.get("filter"), /steps\.interval\.civil_start_time/);
  assert.match(stepsRequest.parsed.searchParams.get("filter"), /< "2026-10-31"/);
  assert.equal(stepsRequest.parsed.searchParams.get("pageSize"), "10000");
  const activeEnergyRequest = requests.find(({ parsed }) => parsed.pathname.endsWith("/active-energy-burned/dataPoints"));
  assert.match(activeEnergyRequest.parsed.searchParams.get("filter"), /active_energy_burned\.interval\.civil_start_time/);
  const exerciseRequests = requests.filter(({ parsed }) => parsed.pathname.endsWith("/exercise/dataPoints"));
  assert.equal(exerciseRequests[0].parsed.searchParams.get("pageSize"), "25");
  assert.equal(exerciseRequests[1].parsed.searchParams.get("pageToken"), "next");
  assert.equal(requests.every(({ options }) => options.headers.Authorization === "Bearer short-lived-access-token"), true);
});

test("returns explicit permission, expiration, and provider errors", async () => {
  await assert.rejects(readGoogleHealthActivity({
    accessToken: "token",
    startDate: "2026-10-24",
    endDate: "2026-10-30",
    fetchImpl: async () => response(403, {}),
  }), { code: "permission-denied" });

  await assert.rejects(readGoogleHealthActivity({
    accessToken: "token",
    startDate: "2026-10-24",
    endDate: "2026-10-30",
    fetchImpl: async () => response(401, {}),
  }), { code: "connection-expired" });

  await assert.rejects(readGoogleHealthActivity({
    accessToken: "token",
    startDate: "2026-10-24",
    endDate: "2026-10-30",
    fetchImpl: async () => { throw new Error("offline"); },
  }), { code: "provider-failed" });

  await assert.rejects(refreshGoogleHealthAccessToken({
    refreshToken: "expired",
    clientId: "client",
    clientSecret: "secret",
    fetchImpl: async () => response(400, { error: "invalid_grant" }),
  }), { code: "invalid_grant" });
});

test("accepts empty provider responses and rejects invalid time windows", async () => {
  const data = await readGoogleHealthActivity({
    accessToken: "token",
    startDate: "2026-10-30",
    endDate: "2026-10-30",
    fetchImpl: async () => response(200, {}),
  });
  assert.deepEqual(data, {
    steps: [],
    distance: [],
    "active-energy-burned": [],
    exercise: [],
  });

  await assert.rejects(readGoogleHealthActivity({
    accessToken: "token",
    startDate: "2026-10-31",
    endDate: "2026-10-30",
  }), GoogleHealthClientError);
});

test("revoke sends only the refresh token to Google's revocation endpoint", async () => {
  let request;
  await revokeGoogleHealthToken({
    token: "refresh-token",
    fetchImpl: async (...args) => {
      request = args;
      return response(200, {});
    },
  });
  assert.equal(request[0], "https://oauth2.googleapis.com/revoke");
  assert.equal(request[1].body.get("token"), "refresh-token");
});
