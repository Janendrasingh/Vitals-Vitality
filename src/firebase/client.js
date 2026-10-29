import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const environment = import.meta.env || {};

const requiredConfig = {
  apiKey: environment.VITE_FIREBASE_API_KEY,
  authDomain: environment.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: environment.VITE_FIREBASE_PROJECT_ID,
  appId: environment.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(requiredConfig).every(
  (value) => typeof value === "string" && value.trim().length > 0
);

const firebaseApp = isFirebaseConfigured
  ? getApps()[0] || initializeApp({
      ...requiredConfig,
      storageBucket: environment.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: environment.VITE_FIREBASE_MESSAGING_SENDER_ID,
    })
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
