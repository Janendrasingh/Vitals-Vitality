import assert from "node:assert/strict";
import test from "node:test";
import { createFitnessRepository } from "./firestoreRepository.js";

function createFakeFirestore(documents) {
  const reads = [];
  const firestore = {
    collection(parent, name) {
      return { path: `${parent.path}/${name}` };
    },
    doc(parent, ...segments) {
      const base = typeof parent === "object" ? parent.path : parent;
      const path = [base, ...segments].filter(Boolean).join("/");
      reads.push(path);
      return { path };
    },
    getDoc: async (reference) => ({
      exists: () => documents.has(reference.path),
      data: () => documents.get(reference.path),
    }),
    getDocs: async () => ({ docs: [] }),
    limit: (count) => ({ count }),
    query: (collectionRef) => ({ path: collectionRef.path }),
    where: (...args) => args,
  };
  return { firestore, reads };
}

test("loads the signed-in user's activity and Google Health integration only", async () => {
  const documents = new Map([
    ["users/user-a/integrations/google_health", { status: "connected" }],
    ["users/user-a/fitnessDaily/2026-10-30", { steps: 8500 }],
  ]);
  const { firestore, reads } = createFakeFirestore(documents);
  const repository = createFitnessRepository({ name: "test-db" }, firestore);

  const snapshot = await repository.loadFitnessSnapshot("user-a", "2026-10-30");

  assert.deepEqual(snapshot.integration, { status: "connected" });
  assert.deepEqual(snapshot.daily, { steps: 8500 });
  assert.deepEqual(snapshot.workouts, []);
  assert.equal(reads.every((path) => path.startsWith("users/user-a")), true);
  assert.equal(reads.includes("users/user-a/integrations/google_health"), true);
});

test("rejects anonymous fitness reads", async () => {
  const { firestore } = createFakeFirestore(new Map());
  const repository = createFitnessRepository({ name: "test-db" }, firestore);

  await assert.rejects(repository.loadFitnessSnapshot("", "2026-10-30"), /signed-in user is required/);
});
