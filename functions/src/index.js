import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import {
  exchangeGoogleAuthorizationCode,
  readGoogleHealthActivity,
  refreshGoogleHealthAccessToken,
  revokeGoogleHealthToken,
  verifyGoogleHealthIdentity,
} from "./googleHealthClient.js";
import {
  googleHealthPermissions,
  googleHealthProviderId,
  normalizeGoogleHealthData,
  persistGoogleHealthSync,
} from "./fitnessData.js";

const REGION = "us-central1";
const activityScope = "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";
const clientId = defineString("GOOGLE_HEALTH_CLIENT_ID");
const clientSecret = defineSecret("GOOGLE_HEALTH_CLIENT_SECRET");
const encryptionKey = defineSecret("GOOGLE_HEALTH_TOKEN_ENCRYPTION_KEY");
const appOrigin = defineString("GOOGLE_HEALTH_APP_ORIGIN");
const functionUrl = defineString("GOOGLE_HEALTH_FUNCTION_URL");
const firestore = getFirestore(initializeApp());

export const googleHealthApi = onRequest({
  region: REGION,
  cors: false,
  secrets: [clientSecret, encryptionKey],
}, async (req, res) => {
  const configuredOrigin = normalizeOrigin(appOrigin.value());

const allowedOrigins = new Set([
  configuredOrigin,
  "http://localhost:5173",
]);

const requestOrigin = req.get("origin");
const requestedPath = req.path.replace(/\/+$/, "") || "/";
const path = ["/callback", "/start", "/sync", "/disconnect"]
  .find((route) => requestedPath.endsWith(route)) || "/";
const isOAuthCallback = path === "/callback" && req.method === "GET";

if (requestOrigin && !allowedOrigins.has(requestOrigin) && !isOAuthCallback) {
  res.status(403).json({ error: "This application origin is not allowed." });
  return;
}

if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.set("Access-Control-Allow-Origin", configuredOrigin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (path === "/callback" && req.method === "GET") {
      await handleOAuthCallback(req, res, configuredOrigin);
      return;
    }

    const uid = await authenticateRequest(req);
    if (path === "/start" && req.method === "POST") {
      await handleOAuthStart(uid, res, configuredOrigin);
      return;
    }
    if (path === "/sync" && req.method === "POST") {
      await handleSync(uid, req, res);
      return;
    }
    if (path === "/disconnect" && req.method === "POST") {
      await handleDisconnect(uid, res);
      return;
    }

    res.status(404).json({ error: "Fitness endpoint not found." });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const code = error?.code || "internal";
    if (status >= 500) console.error("Google Health request failed", { code });
    res.status(status).json({
      code,
      error: status >= 500 ? "The fitness request could not be completed. Try again later." : error.message,
    });
  }
});

async function authenticateRequest(req) {
  const authorization = req.get("authorization") || "";
  const tokenMatch = authorization.match(/^Bearer (.+)$/i);
  if (!tokenMatch) throw httpError(401, "unauthenticated", "Sign in before using Google Health.");

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const identity = await getAuth().verifyIdToken(tokenMatch[1]);
    return identity.uid;
  } catch (error) {
    if ([
      "auth/argument-error",
      "auth/id-token-expired",
      "auth/id-token-revoked",
      "auth/invalid-id-token",
      "auth/user-disabled",
      "auth/user-not-found",
    ].includes(error?.code)) {
      throw httpError(401, "unauthenticated", "Your sign-in session expired. Sign in again.");
    }
    throw error;
  }
}

async function handleOAuthStart(uid, res, origin) {
  const state = randomBytes(32).toString("base64url");
  const expiresAt = Timestamp.fromMillis(Date.now() + 10 * 60 * 1000);
  await firestore.doc(`googleHealthOAuthStates/${hash(state)}`).set({
    uid,
    returnOrigin: origin,
    expiresAt,
  });

  const redirectUri = callbackUrl();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId.value(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: activityScope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  }).toString();
  res.json({ authorizationUrl: authorizationUrl.toString() });
}

async function handleOAuthCallback(req, res, origin) {
  const state = stringQueryParam(req.query.state);
  if (!state) {
    res.status(400).send("The Google Health authorization response is invalid. Return to the app and try again.");
    return;
  }

  let stateData;
  try {
    stateData = await consumeOAuthState(state);
  } catch {
    res.redirect(303, redirectToApp(origin, "failed"));
    return;
  }

  if (req.query.error) {
    res.redirect(303, redirectToApp(stateData.returnOrigin || origin, "denied"));
    return;
  }

  const code = stringQueryParam(req.query.code);
  if (!code) {
    res.redirect(303, redirectToApp(stateData.returnOrigin || origin, "failed"));
    return;
  }

  try {
    const tokens = await exchangeGoogleAuthorizationCode({
      code,
      clientId: clientId.value(),
      clientSecret: clientSecret.value(),
      redirectUri: callbackUrl(),
    });
    if (typeof tokens.access_token !== "string" || !tokens.access_token) {
      throw Object.assign(new Error("Google did not issue an access token."), {
        code: "authorization-failed",
      });
    }
    if (typeof tokens.refresh_token !== "string" || !tokens.refresh_token) {
      throw Object.assign(new Error("Google did not issue offline access."), {
        code: "authorization-failed",
      });
    }

    await verifyGoogleHealthIdentity({ accessToken: tokens.access_token });
    const encryptedToken = encryptRefreshToken(tokens.refresh_token);
    const userRef = firestore.doc(`users/${stateData.uid}`);
    const privateRef = userRef.collection("privateIntegrations").doc(googleHealthProviderId);
    const integrationRef = userRef.collection("integrations").doc(googleHealthProviderId);
    const batch = firestore.batch();
    batch.set(privateRef, {
      uid: stateData.uid,
      ...encryptedToken,
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(integrationRef, {
      uid: stateData.uid,
      providerId: googleHealthProviderId,
      status: "connected",
      permissions: googleHealthPermissions,
      connectedAt: FieldValue.serverTimestamp(),
      disconnectedAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await batch.commit();

    res.redirect(303, redirectToApp(stateData.returnOrigin || origin, "connected"));
  } catch (error) {
    console.error("Google Health authorization callback failed", {
      code: typeof error?.code === "string" ? error.code : "authorization-failed",
    });
    const redirectState = error?.code === "account-not-linked"
      ? "not-linked"
      : error?.code === "identity-permission-denied"
        ? "permission-denied"
        : "failed";
    res.redirect(303, redirectToApp(stateData.returnOrigin || origin, redirectState));
  }
}

async function handleSync(uid, req, res) {
  const { startDate, endDate } = req.body || {};
  validateDateRange(startDate, endDate);

  const privateRef = firestore.doc(`users/${uid}/privateIntegrations/${googleHealthProviderId}`);
  const privateSnapshot = await privateRef.get();
  if (!privateSnapshot.exists) {
    throw httpError(409, "connection-expired", "Reconnect Google Health to continue syncing.");
  }

  const refreshToken = decryptRefreshToken(privateSnapshot.data());
  const accessToken = await refreshAccessToken(refreshToken, uid);
  const dataPointsByType = await readProviderData(accessToken, startDate, endDate, uid);
  const normalized = normalizeGoogleHealthData(dataPointsByType, { startDate, endDate });
  await persistGoogleHealthSync(firestore, FieldValue, uid, normalized);

  res.json({
    syncedAt: Date.now(),
    empty: normalized.workouts.length === 0 && !normalized.daily.some((daily) => [
      daily.steps,
      daily.activeCaloriesKcal,
      daily.workoutDurationMinutes,
      daily.distanceMeters,
      daily.averageHeartRateBpm,
    ].some((value) => value !== null)),
  });
}

async function handleDisconnect(uid, res) {
  const privateRef = firestore.doc(`users/${uid}/privateIntegrations/${googleHealthProviderId}`);
  const privateSnapshot = await privateRef.get();
  if (privateSnapshot.exists) {
    const refreshToken = decryptRefreshToken(privateSnapshot.data());
    try {
      await revokeGoogleHealthToken({ token: refreshToken });
    } catch (error) {
      throw httpError(
        502,
        error?.code || "disconnect-failed",
        "Google could not revoke access. You can also remove Vitals & Vitality from your Google Account permissions."
      );
    }
  }

  await privateRef.delete();
  await firestore.doc(`users/${uid}/integrations/${googleHealthProviderId}`).set({
    uid,
    providerId: googleHealthProviderId,
    status: "disconnected",
    permissions: [],
    disconnectedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  res.json({ status: "disconnected" });
}

async function refreshAccessToken(refreshToken, uid) {
  try {
    return await refreshGoogleHealthAccessToken({
      refreshToken,
      clientId: clientId.value(),
      clientSecret: clientSecret.value(),
    });
  } catch (error) {
    if (error?.code === "invalid_grant") {
      await firestore.doc(`users/${uid}/integrations/${googleHealthProviderId}`).set({
        status: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      throw httpError(409, "connection-expired", "Google Health authorization expired. Reconnect to continue syncing.");
    }
    throw httpError(502, error?.code || "provider-failed", "Google Health could not authorize this sync. Try again.");
  }
}

async function readProviderData(accessToken, startDate, endDate, uid) {
  try {
    return await readGoogleHealthActivity({ accessToken, startDate, endDate });
  } catch (error) {
    if (error?.code === "connection-expired") {
      await firestore.doc(`users/${uid}/integrations/${googleHealthProviderId}`).set({
        status: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      throw httpError(409, error.code, "Google Health authorization expired. Reconnect to continue syncing.");
    }
    if (error?.code === "permission-denied") {
      throw httpError(403, error.code, "Google Health denied access to the requested activity data.");
    }
    if (error?.code === "invalid-argument") {
      throw httpError(400, error.code, error.message);
    }
    throw httpError(502, error?.code || "provider-failed", "Google Health could not return activity data. Try again.");
  }
}

async function consumeOAuthState(state) {
  const stateRef = firestore.doc(`googleHealthOAuthStates/${hash(state)}`);
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(stateRef);
    const data = snapshot.data();
    if (!snapshot.exists || !data?.uid || !data?.expiresAt
      || data.expiresAt.toMillis() < Date.now()) {
      if (snapshot.exists) transaction.delete(stateRef);
      throw new Error("OAuth state is invalid or expired.");
    }
    transaction.delete(stateRef);
    return data;
  });
}

function encryptRefreshToken(token) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    refreshTokenCiphertext: ciphertext.toString("base64"),
    refreshTokenIv: iv.toString("base64"),
    refreshTokenTag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptRefreshToken(data) {
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(data.refreshTokenIv, "base64")
    );
    decipher.setAuthTag(Buffer.from(data.refreshTokenTag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(data.refreshTokenCiphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw httpError(500, "token-storage-failed", "The saved Google Health connection could not be read.");
  }
}

function getEncryptionKey() {
  const key = Buffer.from(encryptionKey.value(), "base64");
  if (key.length !== 32) throw new Error("The token encryption key must decode to 32 bytes.");
  return key;
}

function callbackUrl() {
  const configuredUrl = functionUrl.value();
  if (!configuredUrl) throw new Error("GOOGLE_HEALTH_FUNCTION_URL is not configured.");
  return `${configuredUrl.replace(/\/+$/, "")}/callback`;
}

function redirectToApp(origin, state) {
  const target = new URL("/", origin);
  target.searchParams.set("fitness", state);
  return target.toString();
}

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error("GOOGLE_HEALTH_APP_ORIGIN must be a valid web origin.");
  }
}

function validateDateRange(startDate, endDate) {
  const isDate = (value) => typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
  if (!isDate(startDate) || !isDate(endDate) || startDate > endDate) {
    throw httpError(400, "invalid-argument", "Choose a valid fitness date range.");
  }
}

function stringQueryParam(value) {
  return typeof value === "string" ? value : "";
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function httpError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}
