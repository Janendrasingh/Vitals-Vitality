export class GoogleHealthClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "GoogleHealthClientError";
    this.code = code;
  }
}

export async function verifyGoogleHealthIdentity({
  accessToken,
  fetchImpl = fetch,
}) {
  let response;
  try {
    response = await fetchImpl("https://health.googleapis.com/v4/users/me/identity", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new GoogleHealthClientError(
      "identity-verification-failed",
      "Google Health account verification could not be completed. Try connecting again."
    );
  }

  let result = {};
  try {
    result = await response.json();
  } catch {
    if (response.ok) {
      throw new GoogleHealthClientError(
        "identity-verification-failed",
        "Google Health returned an invalid account verification response."
      );
    }
  }

  if (!response.ok) {
    const errorText = JSON.stringify(result);
    if (errorText.includes("ACCOUNT_NOT_LINKED")) {
      throw new GoogleHealthClientError(
        "account-not-linked",
        "This Google Account is not linked to Google Health. Open the Google Health app, sign in with this account, finish setting up or migrating your profile, then reconnect."
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new GoogleHealthClientError(
        "identity-permission-denied",
        "Google Health could not verify this account. Confirm the requested access was granted and reconnect."
      );
    }
    throw new GoogleHealthClientError(
      "identity-verification-failed",
      "Google Health could not verify this account. Try connecting again later."
    );
  }

  if (typeof result.healthUserId !== "string"
    || !/^[A-Za-z0-9-]{1,63}$/.test(result.healthUserId)) {
    throw new GoogleHealthClientError(
      "identity-verification-failed",
      "Google Health returned an invalid account identity."
    );
  }

  return result;
}

export async function exchangeGoogleAuthorizationCode({
  code,
  clientId,
  clientSecret,
  redirectUri,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new GoogleHealthClientError("authorization-failed", "Google authorization code exchange failed.");
  }
  return response.json();
}

export async function refreshGoogleHealthAccessToken({
  refreshToken,
  clientId,
  clientSecret,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const result = await response.json();
  if (!response.ok || typeof result.access_token !== "string") {
    const code = result.error === "invalid_grant" ? "invalid_grant" : "provider-failed";
    throw new GoogleHealthClientError(code, "Google Health could not authorize this request.");
  }
  return result.access_token;
}

export async function readGoogleHealthActivity({
  accessToken,
  startDate,
  endDate,
  fetchImpl = fetch,
}) {
  validateDateRange(startDate, endDate);
  const nextDate = new Date(`${endDate}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const endExclusive = nextDate.toISOString().slice(0, 10);
  const types = ["steps", "distance", "active-energy-burned", "exercise"];
  const results = await Promise.all(types.map(async (type) => {
    const filterField = type.replaceAll("-", "_");
    const pageSize = type === "exercise" ? 25 : 10000;
    const filter = `${filterField}.interval.civil_start_time >= "${startDate}" AND ${filterField}.interval.civil_start_time < "${endExclusive}"`;
    const dataPoints = [];
    let pageToken;
    let pageCount = 0;
    do {
      const url = new URL(`https://health.googleapis.com/v4/users/me/dataTypes/${type}/dataPoints`);
      url.searchParams.set("filter", filter);
      url.searchParams.set("pageSize", String(pageSize));
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      let response;
      try {
        response = await fetchImpl(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        throw new GoogleHealthClientError("provider-failed", "Google Health could not return activity data.");
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new GoogleHealthClientError("connection-expired", "Google Health authorization expired.");
        }
        if (response.status === 403) {
          throw new GoogleHealthClientError("permission-denied", "Google Health denied access to activity data.");
        }
        throw new GoogleHealthClientError("provider-failed", "Google Health could not return activity data.");
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new GoogleHealthClientError("provider-failed", "Google Health returned an invalid activity response.");
      }
      if (Array.isArray(result.dataPoints)) dataPoints.push(...result.dataPoints);
      pageToken = result.nextPageToken || null;
      pageCount += 1;
      if (pageCount > 100) {
        throw new GoogleHealthClientError("provider-failed", "Google Health returned too many pages for this date range.");
      }
    } while (pageToken);

    return [type, dataPoints];
  }));
  return Object.fromEntries(results);
}

export async function revokeGoogleHealthToken({ token, fetchImpl = fetch }) {
  const response = await fetchImpl("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  });
  if (!response.ok) {
    throw new GoogleHealthClientError("disconnect-failed", "Google could not revoke access.");
  }
}

function validateDateRange(startDate, endDate) {
  const isDate = (value) => typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
  if (!isDate(startDate) || !isDate(endDate) || startDate > endDate) {
    throw new GoogleHealthClientError("invalid-argument", "Choose a valid fitness date range.");
  }
}
