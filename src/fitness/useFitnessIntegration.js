import { useCallback, useEffect, useMemo, useState } from "react";
import { createGoogleHealthProvider } from "./providers/googleHealthApi.js";
import { loadFitnessSnapshot } from "./firestoreRepository.js";
import { getSyncDateRange } from "./dateRange.js";

function todayDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toDate(value) {
  return value?.toDate ? value.toDate() : value instanceof Date ? value : null;
}

export function useFitnessIntegration(uid) {
  const provider = useMemo(() => createGoogleHealthProvider(), []);
  const [state, setState] = useState({
    loading: true,
    connectionStatus: "not-connected",
    syncStatus: "idle",
    error: "",
    integration: null,
    daily: null,
    workouts: [],
  });
  const today = todayDateKey();

  const refresh = useCallback(async () => {
    if (!uid) return;
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const snapshot = await loadFitnessSnapshot(uid, todayDateKey());
      const integrationStatus = snapshot.integration?.status;
      setState((previous) => ({
        ...previous,
        loading: false,
        connectionStatus: integrationStatus === "connected"
          ? "connected"
          : integrationStatus === "expired" ? "expired" : "not-connected",
        syncStatus: "idle",
        integration: snapshot.integration,
        daily: snapshot.daily,
        workouts: snapshot.workouts,
        error: "",
      }));
      return true;
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error.message || "Fitness data could not be loaded.",
      }));
      return false;
    }
  }, [uid]);

  useEffect(() => {
    const hasAuthorizationResult = typeof window !== "undefined"
      && new URL(window.location.href).searchParams.has("fitness");
    if (!hasAuthorizationResult) refresh();
  }, [refresh, today]);

  const connect = useCallback(async () => {
    if (!uid) {
      setState((previous) => ({ ...previous, error: "Sign in before connecting Google Health." }));
      return;
    }
    if (!provider.isAvailable()) {
      setState((previous) => ({
        ...previous,
        syncStatus: "failed",
        error: "Google Health is not configured for this application.",
      }));
      return;
    }

    setState((previous) => ({ ...previous, syncStatus: "connecting", error: "" }));
    try {
      const authorizationUrl = await provider.connect();
      window.location.assign(authorizationUrl);
    } catch (error) {
      setState((previous) => ({
        ...previous,
        syncStatus: error.code === "permission-denied" ? "denied" : "failed",
        error: error.message || "Google Health could not be connected.",
      }));
    }
  }, [provider, uid]);

  const sync = useCallback(async () => {
    if (!uid) {
      setState((previous) => ({ ...previous, error: "Sign in before syncing fitness data." }));
      return;
    }
    if (!provider.isAvailable()) {
      setState((previous) => ({
        ...previous,
        syncStatus: "failed",
        error: "Google Health is not configured for this application.",
      }));
      return;
    }

    setState((previous) => ({ ...previous, syncStatus: "syncing", error: "" }));
    try {
      const result = await provider.sync(getSyncDateRange());
      const loaded = await refresh();
      if (!loaded) {
        throw new Error("Synchronization completed, but imported activity could not be loaded. Refresh the page to retry.");
      }
      setState((previous) => ({
        ...previous,
        loading: false,
        connectionStatus: "connected",
        syncStatus: result.empty ? "empty" : "success",
        error: result.empty
          ? "Google Health returned no activity data for the last 7 days. Check account access and the apps writing your data."
          : "",
      }));
    } catch (error) {
      const expired = error.code === "connection-expired";
      const denied = error.code === "permission-denied";
      setState((previous) => ({
        ...previous,
        loading: false,
        connectionStatus: expired ? "expired" : previous.connectionStatus,
        syncStatus: denied ? "denied" : "failed",
        error: error.message || "Fitness synchronization failed. Try again.",
      }));
    }
  }, [provider, refresh, uid]);

  const disconnect = useCallback(async () => {
    if (!uid) return;
    setState((previous) => ({ ...previous, syncStatus: "disconnecting", error: "" }));
    try {
      await provider.disconnect();
      setState((previous) => ({
        ...previous,
        connectionStatus: "not-connected",
        syncStatus: "idle",
        integration: { ...previous.integration, status: "disconnected", permissions: [] },
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        syncStatus: "failed",
        error: error.message || "Google Health could not be disconnected.",
      }));
    }
  }, [provider, uid]);

  useEffect(() => {
    if (!uid || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const authorizationResult = url.searchParams.get("fitness");
    if (!authorizationResult) return;

    url.searchParams.delete("fitness");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    if (authorizationResult === "connected") {
      refresh().then(() => sync());
    } else {
      refresh().then(() => {
        setState((previous) => ({
          ...previous,
          syncStatus: authorizationResult === "denied" ? "denied" : "failed",
          error: authorizationResult === "denied"
            ? "Google Health access was not granted. No activity data was imported."
            : authorizationResult === "not-linked"
              ? "This Google Account is not linked to Google Health. Open the Google Health app, sign in with this account, finish setup or Fitbit migration, then connect again."
              : authorizationResult === "permission-denied"
                ? "Google Health could not verify this account. Confirm the requested access was granted, then connect again."
            : "Google Health could not be connected. Try again.",
        }));
      });
    }
  }, [refresh, sync, uid]);

  return {
    ...state,
    providerAvailable: provider.isAvailable(),
    daily: state.daily,
    workouts: state.workouts,
    lastSyncedAt: toDate(state.integration?.lastSyncAt),
    connect,
    sync,
    disconnect,
    refresh,
  };
}
