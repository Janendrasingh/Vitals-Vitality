import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth, db, isFirebaseConfigured } from "./firebase/client";
import { loadOrCreateUserProfile, saveUserProfile } from "./firebase/userProfile";
import FirstStep from "./pages/FirstStep";
import SecondStep from "./pages/SecondStep";
import ThirdStep from "./pages/ThirdStep";
import Summary from "./pages/Summary";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";

const emptyProfile = {
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

function LoadingScreen({ message }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div aria-live="polite" className="rounded-2xl bg-white px-8 py-7 text-center shadow-lg">
        <div aria-hidden="true" className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />
        <p className="font-medium text-slate-700">{message}</p>
      </div>
    </main>
  );
}

function ProfileSyncStatus({ status, error, accountEmail, onRetry, onSignOut }) {
  return (
    <aside aria-live={status === "error" ? "assertive" : "polite"} className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-lg">
      <p>{status === "saving" ? "Saving profile…" : status === "error" ? error || "Profile save failed." : `Profile saved${accountEmail ? ` for ${accountEmail}` : ""}.`}</p>
      <div className="mt-2 flex justify-end gap-3">
        {status === "error" && <button className="font-semibold text-red-700 underline" onClick={onRetry} type="button">Retry</button>}
        <button className="font-semibold text-green-800 underline" onClick={onSignOut} type="button">Sign out</button>
      </div>
    </aside>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [profileStatus, setProfileStatus] = useState("idle");
  const [profileError, setProfileError] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved");
  const [saveError, setSaveError] = useState("");
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [signOutError, setSignOutError] = useState("");
  const [step, setStep] = useState(1);
  const [returningFromDashboard, setReturningFromDashboard] = useState(false);
  const [formData, setFormData] = useState(emptyProfile);
  const [profileDirty, setProfileDirty] = useState(false);
  const profileRevision = useRef(0);
  const createdAt = useRef(null);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      return undefined;
    }

    let activeRequest = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const requestId = ++activeRequest;
      profileRevision.current += 1;
      setUser(currentUser);
      setSignOutError("");

      if (!currentUser) {
        setAuthLoading(false);
        setProfileStatus("idle");
        setProfileError("");
        setFormData(emptyProfile);
        setStep(1);
        setProfileDirty(false);
        createdAt.current = null;
        return;
      }

      setAuthLoading(true);
      setProfileStatus("loading");
      setProfileError("");
      try {
        const loadedProfile = await loadOrCreateUserProfile(currentUser);
        if (requestId !== activeRequest) return;
        setFormData(loadedProfile.profile);
        createdAt.current = loadedProfile.createdAt;
        setStep(loadedProfile.profile.onboardingComplete ? 5 : 1);
        setProfileDirty(false);
        setProfileStatus("ready");
      } catch (error) {
        if (requestId !== activeRequest) return;
        setProfileError(error.message || "Your profile could not be loaded from Firestore.");
        setProfileStatus("error");
      } finally {
        if (requestId === activeRequest) setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || profileStatus !== "ready" || !profileDirty || !db) return undefined;
    const revision = profileRevision.current;
    const timeout = window.setTimeout(() => {
      setSaveStatus("saving");
      setSaveError("");
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => saveUserProfile(user, formData, createdAt.current))
        .then((savedCreatedAt) => {
          createdAt.current = savedCreatedAt;
          if (profileRevision.current === revision) {
            setProfileDirty(false);
            setSaveStatus("saved");
          }
        })
        .catch((error) => {
          if (profileRevision.current === revision) {
            setSaveStatus("error");
            setSaveError(error.message || "Your profile changes could not be saved.");
          }
        });
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [formData, profileDirty, profileStatus, saveAttempt, user]);

  function updateFormData(update) {
    profileRevision.current += 1;
    setFormData((previous) => (typeof update === "function" ? update(previous) : update));
    setProfileDirty(true);
  }

  function nextStep() {
    if (step < 4) setStep((previous) => previous + 1);
  }

  function prevStep() {
    if (step > 1) setStep((previous) => previous - 1);
  }

  function editStep(targetStep) {
    setReturningFromDashboard(true);
    setStep(targetStep);
  }

  function returnToDashboard() {
    updateFormData((previous) => ({ ...previous, onboardingComplete: true }));
    setReturningFromDashboard(false);
    setStep(5);
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (error) {
      setSignOutError(error.message || "Could not sign out. Please try again.");
    }
  }

  if (!isFirebaseConfigured) {
    return <AuthPage configured={false} />;
  }

  if (authLoading) {
    return <LoadingScreen message={user ? "Loading your secure health profile…" : "Checking your sign-in…"} />;
  }

  if (!user) {
    return <AuthPage configured onSignInError={setSignOutError} />;
  }

  if (profileStatus === "loading") {
    return <LoadingScreen message="Loading your health profile…" />;
  }

  if (profileStatus === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Profile unavailable</h1>
          <p className="mt-3 text-slate-600">{profileError}</p>
          <p className="mt-3 text-sm text-slate-500">Check your Firebase project configuration and Firestore rules, then try again.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800" onClick={() => window.location.reload()} type="button">Retry</button>
            <button className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50" onClick={handleSignOut} type="button">Sign out</button>
          </div>
        </section>
      </main>
    );
  }

  switch (step) {
    case 1:
      return (
        <div>
          <ProfileSyncStatus status={saveStatus} error={saveError} accountEmail={user.email} onRetry={() => setSaveAttempt((attempt) => attempt + 1)} onSignOut={handleSignOut} />
          {signOutError && <p aria-live="assertive" className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">{signOutError}</p>}
          <FirstStep step={step} nextStep={nextStep} formData={formData} setFormData={updateFormData} onReturnDashboard={returningFromDashboard ? returnToDashboard : undefined} />
        </div>
      );
    case 2:
      return (
        <div>
          <ProfileSyncStatus status={saveStatus} error={saveError} accountEmail={user.email} onRetry={() => setSaveAttempt((attempt) => attempt + 1)} onSignOut={handleSignOut} />
          {signOutError && <p aria-live="assertive" className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">{signOutError}</p>}
          <SecondStep step={step} nextStep={nextStep} prevStep={prevStep} formData={formData} setFormData={updateFormData} onReturnDashboard={returningFromDashboard ? returnToDashboard : undefined} />
        </div>
      );
    case 3:
      return (
        <div>
          <ProfileSyncStatus status={saveStatus} error={saveError} accountEmail={user.email} onRetry={() => setSaveAttempt((attempt) => attempt + 1)} onSignOut={handleSignOut} />
          {signOutError && <p aria-live="assertive" className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">{signOutError}</p>}
          <ThirdStep step={step} nextStep={nextStep} prevStep={prevStep} formData={formData} setFormData={updateFormData} onReturnDashboard={returningFromDashboard ? returnToDashboard : undefined} />
        </div>
      );
    case 4:
      return (
        <div>
          <ProfileSyncStatus status={saveStatus} error={saveError} accountEmail={user.email} onRetry={() => setSaveAttempt((attempt) => attempt + 1)} onSignOut={handleSignOut} />
          <Summary step={step} userData={formData} onGoDashboard={returnToDashboard} />
        </div>
      );
    case 5:
      return (
        <Dashboard
          userData={formData}
          setUserData={updateFormData}
          onEditStep={editStep}
          userId={user.uid}
          onSignOut={handleSignOut}
          accountEmail={user.email}
          profileSaveStatus={saveStatus}
          profileSaveError={saveError}
          accountError={signOutError}
          onRetryProfileSave={() => setSaveAttempt((attempt) => attempt + 1)}
        />
      );
    default:
      return <FirstStep step={1} nextStep={nextStep} formData={formData} setFormData={updateFormData} />;
  }
}
