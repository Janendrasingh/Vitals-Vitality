import { auth } from "../../firebase/client.js";

const providerId = "google_health";
const functionUrl = (import.meta.env || {}).VITE_GOOGLE_HEALTH_FUNCTION_URL || "";

export function createGoogleHealthProvider({
  getIdToken = () => auth?.currentUser?.getIdToken(),
  fetchImpl = globalThis.fetch,
  baseUrl = functionUrl,
} = {}) {
  const isAvailable = () => Boolean(baseUrl && fetchImpl);

  async function request(path, body) {
    if (!baseUrl || typeof fetchImpl !== "function") {
      throw new Error("Google Health is not configured for this application.");
    }

    const idToken = await getIdToken?.();
    if (!idToken) {
      const error = new Error("Sign in before using Google Health.");
      error.code = "unauthenticated";
      throw error;
    }

    const response = await fetchImpl(`${baseUrl.replace(/\/+$/, "")}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body || {}),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || "The Google Health request failed.");
      error.code = result.code || "provider-failed";
      throw error;
    }
    return result;
  }

  return {
    id: providerId,
    name: "Google Health",
    isAvailable,
    async connect() {
      const result = await request("start");
      if (typeof result.authorizationUrl !== "string") {
        throw new Error("Google Health did not return an authorization link.");
      }
      return result.authorizationUrl;
    },
    sync(dateRange) {
      return request("sync", dateRange);
    },
    disconnect() {
      return request("disconnect");
    },
  };
}
