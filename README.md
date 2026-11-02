# Smart Diet Planner & Tracker

## 📖 Overview

Smart Diet Planner & Tracker is a full-stack health and fitness application designed to help users maintain a healthier lifestyle through personalized nutrition planning and fitness tracking.

The platform integrates workout and activity data from fitness bands, smartwatches, and popular fitness applications to generate customized diet recommendations based on the user's daily energy expenditure and fitness goals. Users can monitor calorie intake, track nutritional values, analyze workout performance, and visualize their progress through an interactive dashboard.

By combining fitness analytics, nutrition management, and intelligent recommendations, this project aims to provide a comprehensive solution for individuals seeking to improve their overall health and wellness.

## 🚀 Key Features

* Personalized diet plan generation based on fitness activity
* Integration with fitness bands and health applications
* Daily calorie and nutrient tracking
* Workout and activity monitoring
* Progress analytics and health insights dashboard
* Goal-based recommendations for weight loss, maintenance, and muscle gain
* Secure user authentication and profile management
* Real-time health statistics and reports

## 🛠️ Tech Stack

* React 19, JavaScript/JSX, Vite, Tailwind CSS, and lucide-react
* Firebase Authentication (email/password) for accounts
* Cloud Firestore for per-user onboarding profiles
* Google Health API integration through authenticated Firebase Cloud Functions; browser code does not hold Google tokens or OAuth client secrets

## Firebase setup

The app requires a Firebase Web App configuration before registration or sign-in can be used. The web configuration values are client-side identifiers, not service-account credentials; access is restricted by Firebase Authentication and [firestore.rules](./firestore.rules).

1. Create a Firebase project in the Firebase Console. The app does not enable billing or paid services.
2. Register a Web App in the project and copy its configuration values.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. Create a Firestore database. Choose its location carefully; it cannot be changed after creation.
5. In **Firestore Database → Rules**, publish the contents of `firestore.rules`. Users can access only their own profile and read their fitness and integration records. Fitness records and integration status are server-written; credentials and other collections are inaccessible to browser clients.
6. Copy `.env.example` to `.env.local` in this project folder and fill in the `VITE_FIREBASE_*` values from the Web App settings. Keep `.env.local` private and never add service-account keys or client secrets to `VITE_` variables.
7. Restart the Vite development server, then register an account and complete the profile. The app loads the Firebase auth session on startup and saves profile changes to Firestore.

The stored user profile contains the account UID/email, onboarding fields (name, age, body measurements, goals, activity, diet and allergies, lifestyle details), completion state, and creation/update timestamps. Existing unauthenticated `vitalsProfile` browser data is not automatically copied into a new account, to avoid attaching one person's local health data to another account. Dashboard meal, hydration, manual activity, and weight logs are migrated from the signed-in user's `vitalsDashboard:{uid}` local-storage entry into that same user's Firestore records. The migration uses stable entry IDs, does not remove local data, and does not overwrite existing cloud entries. Firestore snapshots synchronize these records across signed-in devices.

If authentication or profile loading fails, check the browser message, Firebase Console provider/database configuration, and the published Firestore rules. No Firebase project credentials have been included in this repository.

### Firebase Hosting and PWA

The Vite production build is served from `dist/` by Firebase Hosting. The Hosting configuration includes an SPA fallback for client-side routes. The web app manifest, application icons, service worker, and offline fallback are included. The service worker caches only same-origin static build assets, icons, and the manifest; it does not cache HTML navigations, Firebase data, authentication responses, or Google Health API responses. Signing in and syncing require a network connection.

1. Install and sign in to the Firebase CLI, then select the existing project:

   ```powershell
   npm install --global firebase-tools
   firebase login
   firebase use --add
   ```

2. Ensure `.env.local` contains the production Firebase Web App values. These `VITE_FIREBASE_*` values are public client configuration, not service-account credentials. Set `VITE_GOOGLE_HEALTH_FUNCTION_URL` only after the function has been deployed.
3. Build and deploy only the website:

   ```powershell
   npm run build
   firebase deploy --only hosting
   ```

   This does not deploy Cloud Functions. Firebase Hosting commonly serves the app at `https://PROJECT_ID.web.app`; add the chosen production origin to Firebase Authentication's authorized domains and to the Google OAuth client's **Authorized JavaScript origins**. The production app origin must exactly match `GOOGLE_HEALTH_APP_ORIGIN`.

### Dashboard log synchronization

When an authenticated user opens the dashboard, current-day meals, water, manual steps/workouts, and retained weight history from that UID's local-storage cache are migrated into:

* `users/{uid}/dashboardDays/{YYYY-MM-DD}` for the day's water and manual steps.
* `users/{uid}/dashboardDays/{YYYY-MM-DD}/meals/{entryId}` for meals.
* `users/{uid}/dashboardDays/{YYYY-MM-DD}/manualWorkouts/{entryId}` for manually logged workouts.
* `users/{uid}/weightEntries/{entryId}` for weight history.

Stable IDs make retries idempotent. Existing Firestore entries are left intact; day-level water and steps preserve the greater local/cloud count, and water updates use a Firestore transaction. Meal log removal deletes only that owner's meal record and updates the nutrition totals immediately. Dashboard snapshots provide cross-device updates. Local storage is retained as a fallback and migration source. If rules are not published or a write fails, the dashboard displays a cloud-sync error and keeps the local copy. Publish the updated rules before relying on cloud synchronization.

## 🎯 Project Objective

The objective of this project is to bridge the gap between fitness tracking and nutrition management by creating a unified platform that automatically adjusts dietary recommendations based on a user's physical activity, health goals, and progress over time.

## Fitness data integration

### Provider and architecture

This repository is a React/Vite web application and has no Android companion. A browser cannot call Android Health Connect directly. Google's migration guidance says Google Fit APIs remain supported through the end of 2026 and recommends Google Health for cloud/web integrations; Health Connect remains the native Android option. This implementation uses Google Health rather than legacy Fit REST endpoints. See [Google Fit migration guidance](https://developer.android.com/health-and-fitness/health-connect/migration/fit), [Google Health API setup](https://developers.google.com/health/setup), and [Google Health scopes](https://developers.google.com/health/scopes).

OAuth authorization, token refresh, provider requests, and Firestore writes run in `functions/src/index.js`. The browser sends the Firebase ID token to the function, receives no Google access or refresh token, and only reads the resulting user's Firestore records. The server stores the Google refresh token encrypted with AES-256-GCM in `users/{uid}/privateIntegrations/google_health`; Firestore client rules deny access to that collection. OAuth client secrets and the token-encryption key are Cloud Functions secrets, not frontend environment variables. The initial sync imports seven days, and subsequent syncs are user initiated; continuous/background synchronization is not implemented.

The function requests only `googlehealth.activity_and_fitness.readonly`. Google Health may return steps, distance, active energy burned, exercise sessions, and workout summary measurements when the connected account/provider has supplied them. Daily active energy is not total daily energy expenditure. Average heart rate is retained for exercise sessions when present; a daily average remains unavailable unless provided. Missing values stay `null`, and actual data depends on the connected account and the apps/devices sending data.

### Firestore records and security

* `users/{uid}/fitnessDaily/{YYYY-MM-DD}` stores provider, nullable steps, `activeCaloriesKcal`, workout duration, distance, optional daily heart rate, and a Firestore server timestamp.
* `users/{uid}/workouts/{sha256(providerId:sourceWorkoutId)}` stores stable source ID, provider, activity type, start/end times, duration, optional distance/heart rate, and server timestamp. Overlapping workout intervals contribute only their union to daily workout duration. Stable IDs make repeat syncs update existing records.
* `users/{uid}/integrations/google_health` stores connected/expired/disconnected status, granted scope, and server-side timestamps.
* `users/{uid}/privateIntegrations/google_health` stores only the encrypted refresh token and is inaccessible to browser clients.

Only the authenticated owner can read their fitness and integration documents. Client create/update/delete is denied for fitness records and integrations; the authenticated Cloud Function writes provider data using the Admin SDK. Rules also deny access to private integration credentials and unlisted collections. Publish the updated `firestore.rules`.

### Manual configuration before live use

No live provider connection or data retrieval can be claimed until these external steps are completed:

1. In Google Cloud Console, enable the Google Health API for the project and confirm that the project/account is eligible for API access. Complete any Google Health developer enrollment, consent-screen verification, and production approval required for your intended audience. Add test users while the OAuth consent screen is in testing.
2. Create a **Web application** OAuth client. Add the exact redirect URI `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/googleHealthApi/callback`. Configure the app's approved domain and branding as required by Google.
3. Configure the Firebase CLI for the existing project. The function targets Node.js 22. Cloud Functions deployment requires the Blaze billing plan; this implementation does not enable billing or deploy anything. Review Firebase/Google Cloud pricing and explicitly approve any billing-plan change before proceeding.
4. Configure the non-secret function parameters and frontend URL. Substitute your project ID and final Hosting origin; do not put OAuth secrets in either file:

   ```powershell
   $projectId = "YOUR_PROJECT_ID"
   Copy-Item functions\.env.example "functions\.env.$projectId"
   notepad "functions\.env.$projectId"
   Copy-Item .env.example .env.local
   notepad .env.local
   ```

   In `functions/.env.YOUR_PROJECT_ID`, set `GOOGLE_HEALTH_CLIENT_ID`, `GOOGLE_HEALTH_APP_ORIGIN` (for example `https://YOUR_PROJECT_ID.web.app`, with no path), and `GOOGLE_HEALTH_FUNCTION_URL` (`https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/googleHealthApi`). In root `.env.local`, set `VITE_GOOGLE_HEALTH_FUNCTION_URL` to that same function base URL. The frontend Firebase values must also be set in `.env.local`.
5. Set the two server-only secrets in the Firebase project:

   ```sh
   firebase functions:secrets:set GOOGLE_HEALTH_CLIENT_SECRET
   ```

   Generate a 32-byte encryption key locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` and set it with:

   ```sh
   firebase functions:secrets:set GOOGLE_HEALTH_TOKEN_ENCRYPTION_KEY
   ```

   Keep both values private and back up the encryption key securely. Losing it prevents decrypting saved refresh tokens; rotating it requires a deliberate token re-encryption or reconnect migration.
6. Publish Firestore rules and deploy the function as separate operations, only after reviewing the rules, verifying all Google/Firebase configuration, and approving any required billing change:

   ```powershell
   firebase deploy --only firestore:rules
   firebase deploy --only functions:googleHealthApi
   ```

7. After deploying the function, verify that the configured function URL and OAuth callback match exactly, rebuild the frontend with its `VITE_GOOGLE_HEALTH_FUNCTION_URL`, then deploy the website separately with `firebase deploy --only hosting`. Sign in and connect from **Activity**. The callback calls Google Health `users.getIdentity`; an unlinked, unauthorized, malformed, or failed identity response will not be marked connected. Successful consent and verification trigger the initial seven-day sync; later synchronizations are manual. Disconnect revokes Google access and removes the server-side token record.

Google may require additional API access approval or OAuth app verification before users outside the configured test audience can connect. Do not put the OAuth client secret, encryption key, access token, or refresh token in `.env.local`, any `VITE_` variable, source control, or Firestore client-readable records.

Run the app and checks from this folder:

```sh
npm install
npm run dev
npm test
npm --prefix functions test
npm run lint
npm run build
```

The tests cover provider payload normalization, unavailable values, duplicate records, overlapping workouts, date ranges, Firestore persistence paths, browser authentication headers, empty responses, permission errors, and provider failures. Firestore Emulator rules tests and live Google OAuth/API calls require external configuration and are not claimed as tested in this workspace.

Meal suggestions are examples filtered against the selected diet and known allergies. They are not medical advice; users should check ingredient labels and cross-contamination warnings.

## 📌 Future Enhancements

* Barcode-based food scanning
* Mobile application support
* Machine learning-based health predictions

## 👨‍💻 Author

Janendra Singh

Developed as a health-tech project to demonstrate full-stack development, API integration, data analytics, and personalized recommendation systems.

## Personalized nutrition plans

The dashboard estimates daily energy and macronutrient targets from the profile's age, weight, height, gender, usual activity level, and goal. The estimate uses the Mifflin–St Jeor BMR equation, activity multipliers of 1.2 (sedentary), 1.55 (moderate), and 1.725 (very active), a weight-loss adjustment capped at 500 kcal/day and 20% of TDEE, and a muscle-gain adjustment capped at 300 kcal/day and 10% of TDEE. Weight-loss targets are not set below estimated BMR. Protein is weight- and goal-based, fat is 30% of target calories, and carbohydrate calories use the remainder.

These are estimates, not medical advice. Missing or unsupported profile values do not produce a target. Synced active calories and workouts inform meal-selection context only; they are not added to TDEE. Food intake shown in the dashboard is user-logged data, not a sensor measurement.

Daily targets are stored separately from profile data at `users/{uid}/nutritionPlans/{YYYY-MM-DD}`. Firestore rules allow only the authenticated owner to read or write validated plan records. Logged meal macros show consumed and remaining values when all entries include those values; incomplete manual logs are not treated as zero. Optional fibre is stored/displayed only when supplied by the user or a future verified source. No fibre target or nutrition value is invented. The Activity page shows a clearly labeled 10,000-step reference, not a personalized goal.

Meal selection requires verified nutrition records, portion sizes, ingredients, allergen metadata, and source citations. When a catalog is configured, candidates are ranked against the remaining calorie and macro estimates, dietary restrictions, allergies, and available activity context; a meal larger than the remaining calorie allowance is excluded. The repository currently has no verified meal dataset configured, so the app intentionally displays meal slots without invented nutritional values. To enable recommendations, populate `src/nutrition/mealCatalog.js` with sourced records following the validator in `src/nutrition/mealRecommendations.js`; records without complete nutrition and source metadata are excluded.

Run the frontend checks from `Vitals and Vitality/`:

```sh
npm test
npm run lint
npm run build
```
