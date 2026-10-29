import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { HeartPulse, LockKeyhole, Mail, UserRound } from "lucide-react";
import { auth } from "../firebase/client";

export default function AuthPage({ configured, onSignInError }) {
  const [mode, setMode] = useState("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!configured || !auth) return;
    if (mode === "register" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (fullName.trim()) {
          await updateProfile(credential.user, { displayName: fullName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (authError) {
      const message = getAuthErrorMessage(authError);
      setError(message);
      onSignInError?.(message);
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl md:p-10">
          <Brand />
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <h1 className="text-xl font-bold">Firebase setup required</h1>
            <p className="mt-2 text-sm leading-6">
              Authentication is not available until the Firebase web app settings are added to your local environment.
            </p>
          </div>
          <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to <code className="rounded bg-slate-100 px-1">.env.local</code>.</li>
            <li>Fill in the Firebase Web App values and restart the Vite server.</li>
            <li>Enable Email/Password sign-in and create a Firestore database in Firebase Console.</li>
          </ol>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-slate-100 to-emerald-100 p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl sm:p-9">
        <Brand />
        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            {mode === "register" ? "Start your wellness journey" : "Welcome back"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {mode === "register" ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your health profile is saved privately to your account.
          </p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <span className="relative mt-1.5 block">
                <UserRound aria-hidden="true" className="absolute left-3 top-3 text-slate-400" size={18} />
                <input autoComplete="name" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" maxLength={100} onChange={(event) => setFullName(event.target.value)} required value={fullName} />
              </span>
            </label>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Email
            <span className="relative mt-1.5 block">
              <Mail aria-hidden="true" className="absolute left-3 top-3 text-slate-400" size={18} />
              <input autoComplete="email" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </span>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <span className="relative mt-1.5 block">
              <LockKeyhole aria-hidden="true" className="absolute left-3 top-3 text-slate-400" size={18} />
              <input autoComplete={mode === "register" ? "new-password" : "current-password"} className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" minLength={mode === "register" ? 8 : undefined} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
            </span>
          </label>
          {mode === "register" && (
            <label className="block text-sm font-medium text-slate-700">
              Confirm password
              <span className="relative mt-1.5 block">
                <LockKeyhole aria-hidden="true" className="absolute left-3 top-3 text-slate-400" size={18} />
                <input autoComplete="new-password" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
              </span>
            </label>
          )}
          {error && <p aria-live="assertive" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button className="w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-wait disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {mode === "register" ? "Already have an account?" : "New to Vitals & Vitality?"}{" "}
          <button className="font-semibold text-green-700 hover:text-green-800" onClick={() => { setError(""); setMode(mode === "register" ? "signin" : "register"); }} type="button">
            {mode === "register" ? "Sign in" : "Create account"}
          </button>
        </p>
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700"><HeartPulse size={24} /></span>
      <span className="text-lg font-extrabold text-green-800">Vitals &amp; Vitality</span>
    </div>
  );
}

function getAuthErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already uses this email. Try signing in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 8 characters.";
    case "auth/network-request-failed":
      return "A network error prevented sign-in. Check your connection and try again.";
    case "auth/too-many-requests":
      return "There have been too many attempts. Wait a little and try again.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is disabled. Enable it in Firebase Console.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}
