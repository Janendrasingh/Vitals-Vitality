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

The stored user profile contains the account UID/email, onboarding fields (name, age, body measurements, goals, activity, diet and allergies, lifestyle details), completion state, and creation/update timestamps. Existing unauthenticated `vitalsProfile` browser data is not automatically copied into a new account, to avoid attaching one person's local health data to another account. Dashboard meal, hydration, manual activity, and weight logs remain in browser local storage in this phase; they are partitioned by Firebase UID and are not account-synced.

If authentication or profile loading fails, check the browser message, Firebase Console provider/database configuration, and the published Firestore rules. No Firebase project credentials have been included in this repository.

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
3. Configure Firebase CLI for the existing Firebase project (`firebase login`, then `firebase use --add`). The function targets the Firebase-supported Node.js 22 runtime. Cloud Functions deployment requires the Blaze billing plan; this implementation does not enable billing or deploy anything. Review Firebase/Google Cloud pricing before choosing to upgrade. Normal use may fall within applicable no-cost quotas, but charges are possible.
4. Copy `functions/.env.example` to `functions/.env.YOUR_PROJECT_ID` and fill in the OAuth client ID, exact web-app origin (scheme + host, no path), and deployed function base URL. This file is ignored by git. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_HEALTH_FUNCTION_URL` to that same function base URL.
5. Set the two server-only secrets in the Firebase project:

   ```sh
   firebase functions:secrets:set GOOGLE_HEALTH_CLIENT_SECRET
   ```

   Generate a 32-byte encryption key locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` and set it with:

   ```sh
   firebase functions:secrets:set GOOGLE_HEALTH_TOKEN_ENCRYPTION_KEY
   ```

   Keep both values private and back up the encryption key securely. Losing it prevents decrypting saved refresh tokens; rotating it requires a deliberate token re-encryption or reconnect migration.
6. Publish rules and deploy the function only after reviewing billing and configuration:

   ```sh
   firebase deploy --only firestore:rules,functions:googleHealthApi
   ```

7. Copy the deployed function base URL to `VITE_GOOGLE_HEALTH_FUNCTION_URL`, restart Vite, sign in, and connect from **Activity**. Google consent must succeed before the server marks the integration connected. The callback then triggers the initial seven-day sync; later synchronizations are manual. Disconnect revokes Google access and removes the server-side token record.

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
