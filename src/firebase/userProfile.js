import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./client";

export const emptyUserProfile = {
  fullName: "",
  age: "",
  weight: "",
  height: "",
  gender: "",
  activity: "",
  goal: "",
  diets: [],
  allergies: [],
  customAllergies: [],
  targetWeight: "",
  lifestyleGoal: "Maintain",
  activityScore: 50,
  typicalDay: "",
  onboardingComplete: false,
};

function normalizeProfile(data = {}) {
  return {
    ...emptyUserProfile,
    ...data,
    diets: Array.isArray(data.diets) ? data.diets : [],
    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    customAllergies: Array.isArray(data.customAllergies) ? data.customAllergies : [],
    activityScore: Number.isFinite(data.activityScore) ? data.activityScore : 50,
    onboardingComplete: data.onboardingComplete === true,
  };
}

function profileDocument(user, profile, createdAtValue) {
  return {
    uid: user.uid,
    email: user.email,
    ...normalizeProfile(profile),
    createdAt: createdAtValue || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function loadOrCreateUserProfile(user) {
  if (!db) throw new Error("Firebase is not configured.");
  const profileRef = doc(db, "users", user.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (profileSnapshot.exists()) {
    const data = profileSnapshot.data();
    return {
      profile: normalizeProfile(data),
      createdAt: data.createdAt || null,
    };
  }

  const initialProfile = {
    ...emptyUserProfile,
    fullName: user.displayName || "",
  };
  await setDoc(profileRef, profileDocument(user, initialProfile));
  const createdSnapshot = await getDoc(profileRef);
  const createdData = createdSnapshot.data();
  return {
    profile: normalizeProfile(createdData),
    createdAt: createdData.createdAt || null,
  };
}

export async function saveUserProfile(user, profile, createdAtValue) {
  if (!db) throw new Error("Firebase is not configured.");
  const profileRef = doc(db, "users", user.uid);
  await setDoc(profileRef, profileDocument(user, profile, createdAtValue));
  return createdAtValue;
}
