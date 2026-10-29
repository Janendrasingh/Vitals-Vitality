import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/client.js";

const repository = createFitnessRepository(db, {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
});

export const loadFitnessSnapshot = repository.loadFitnessSnapshot;

export function createFitnessRepository(database, firestore) {
  function requireDatabase() {
    if (!database) throw new Error("Firebase Firestore is not configured.");
  }

  async function loadFitnessSnapshot(uid, date) {
    requireDatabase();
    requireUid(uid);

    const userRef = firestore.doc(database, "users", uid);
    const dailyRef = firestore.doc(userRef, "fitnessDaily", date);
    const integrationRef = firestore.doc(userRef, "integrations", "google_health");
    const workoutsQuery = firestore.query(
      firestore.collection(userRef, "workouts"),
      firestore.where("date", "==", date),
      firestore.limit(50)
    );
    const [integrationSnapshot, dailySnapshot, workoutSnapshot] = await Promise.all([
      firestore.getDoc(integrationRef),
      firestore.getDoc(dailyRef),
      firestore.getDocs(workoutsQuery),
    ]);

    return {
      integration: integrationSnapshot.exists() ? integrationSnapshot.data() : null,
      daily: dailySnapshot.exists() ? dailySnapshot.data() : null,
      workouts: workoutSnapshot.docs.map((workout) => workout.data()),
    };
  }

  return { loadFitnessSnapshot };
}

function requireUid(uid) {
  if (typeof uid !== "string" || !uid.trim()) {
    throw new Error("A signed-in user is required to access fitness records.");
  }
}
