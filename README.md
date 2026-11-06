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

The stored user profile contains the account UID/email, onboarding fields (name, age, body measurements, goals, activity, diet, food preferences and allergies, lifestyle details), completion state, and creation/update timestamps. Existing unauthenticated `vitalsProfile` browser data is not automatically copied into a new account, to avoid attaching one person's local health data to another account. Dashboard meal, hydration, manual activity, and weight logs are migrated from the signed-in user's `vitalsDashboard:{uid}` local-storage entry into that same user's Firestore records. The migration uses stable entry IDs, does not remove local data, and does not overwrite existing cloud entries. Firestore snapshots synchronize these records across signed-in devices.

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

Daily targets are stored separately from profile data at `users/{uid}/nutritionPlans/{YYYY-MM-DD}`. Firestore rules allow only the authenticated owner to read or write validated plan records. Logged meal macros show consumed and remaining values when all entries include those values; incomplete manual logs are not treated as zero. Fibre from a calculated meal is included when its source records provide it; incomplete manual logs remain unknown. No fibre target is inferred. The Activity page shows a clearly labeled 10,000-step reference, not a personalized goal.

### Ingredient database and meal calculations

`src/nutrition/database/ingredients.js` contains 73 normalized per-100-g ingredient records across grains, pulses, dairy, vegetables, fruits, nuts/seeds, oils, and spices. Each record includes its preparation state, quantity basis, source name, exact FoodData Central record ID, source URL, and verification status. Values come from the USDA FoodData Central SR Legacy (April 2018) dataset, with the paneer record from the Survey/FNDDS (October 2024) dataset. These are generic matches, not India-specific cultivar, recipe, or brand measurements; see `src/nutrition/database/nutritionSources.js`. No ICMR-NIN IFCT values were imported because no exact IFCT records were verified in this work. Thirteen USDA records have been added across the previous and current coverage reviews. The four latest additions are cardamom, ground cinnamon, ground cloves, and dried fenugreek seeds. They have source-cited nutrition but are deliberately not mapped to whole cardamom/cinnamon/cloves or kasuri methi. Canned coconut milk remains unverified because its source record lacks fibre; that missing value remains `null`.

The meal logger can calculate calories, protein, carbohydrates, fat, fibre, and source-reported micronutrients from entered ingredient weights using `calculateMealNutrition`. Quantities must match the ingredient's listed raw/dry/as-sold state and edible/consumed basis; cooking yield and oil absorption are not inferred. Missing core nutrients make the calculation unavailable. An optional nutrient is reported only when every non-zero ingredient has that value; otherwise the total is shown as unavailable rather than zero.

The Indian recipe catalog in `src/nutrition/database/recipes.js` currently includes masoor dal, chana masala, rajma masala, aloo gobi, vegetable upma, paneer bhurji, palak paneer, matar paneer, and coconut milk pulao. Recipe references link to the named recipe pages at Swasthi's Recipes. Eight recipes have had their source recipe-card ingredients, yields, and preparation methods reviewed and their full source ingredient lists recorded. The Coconut Milk Pulao page did not expose a reviewable recipe card in this review, so its composition, yield, and instructions remain unchecked. Recipe source ingredients include optional ingredients and substitutions; the mapped numeric quantities remain a separate estimate.

Recipe nutrition is calculated at runtime from the shared ingredient database; recipe records do not store calorie or macro totals. The added records do not cover all recipe ingredients: chana dal, urad dal, curry leaves, asafoetida, kasuri methi, garam masala blends, bay leaf, amchur, and several source-specific spice forms remain unmapped. Fenugreek seeds are not a substitute for fenugreek leaves; ground cinnamon and cloves are not substituted for whole spices. Some household measures remain approximate, ingredient-to-source matches are not verified, cooking changes to water weight or oil absorption are not modeled, and allergen information remains partial for all recipes because alternatives and cross-contact are unresolved. Although eight original recipe cards were reviewed, none has complete evidence for composition, exact quantities, preparation, yield, dietary classification, and allergens. Coconut Milk Pulao remains unreviewed. All recipes therefore remain estimated or incomplete, show mapped-ingredient nutrition and explicit coverage/verification gaps in the Recipes dashboard, and are excluded from verified recommendations.

Ingredient, recipe, source, quantity, nutrient, serving, allergen, and evidence checks are available from `src/nutrition/database/nutritionValidation.js`. Recommendations remain restricted to recipes that pass the evidence-based verification gate and have complete calculated calorie, macro, fibre, and allergen metadata. Daily calorie and macro consumption is calculated from today's logged meals; if any logged meal lacks valid calories or a required macro, that remaining target stays unavailable and personalized recommendations pause rather than treating missing data as zero. The ranker filters declared allergies (unknown allergy categories fail closed), dietary tags, and food preferences, excludes recipes already logged that day, then scores the remaining portions against the residual calorie and macro budgets. The profile's age, weight, height, gender, usual activity level, and weight-loss/muscle-gain/maintenance goal determine estimated calorie and macro targets; imported activity informs context only and is not double-counted in TDEE. The current recipe catalog has no eligible verified meals, so the dashboard correctly shows no verified recommendations until recipes pass the full evidence and data-coverage gate.

The dashboard's five-slot daily meal plan (breakfast, mid-morning snack, lunch, evening snack, and dinner) is calculated by `src/nutrition/dailyMealPlan.js` from the same verified catalog and remaining daily balance. Calorie shares can be adjusted in the UI and must total 100%; the defaults are flexible estimates, not a medical prescription. Planned meals are recommendations only and are not written to Firestore or the existing meal log. Replacing a planned item filters out logged meals and other meals in the plan, then recalculates the plan nutrition and remaining daily balance. Since the current recipe catalog contains no eligible verified meals, the plan shows an empty state instead of estimated or invented recipes.

Nutrient units are standardized per ingredient nutrient key in `src/nutrition/database/nutritionUnits.js` and exposed as `nutritionUnits` metadata on ingredient records. Database validation checks unit completeness and rejects unsupported nutrient keys or unit mismatches. Units are not inferred from arbitrary labels in recipe data.

### Phase 5.5 recipe evidence audit

The audit retained all existing records and added no recipe or ingredient nutrition values: the reviewed candidates did not have sufficient complete evidence to map every source ingredient to exact nutrition records and verify allergens. Counts after this audit are **9 recipes**, **73 unique ingredients**, **0 verified recipes**, **9 estimated recipes**, and **0 records marked incomplete**. All nine recipes remain ineligible. “Estimated” describes the catalog record; it does not mean the recipe is safe or complete to recommend. Nutrition coverage is partial for all entries, and any displayed calculation covers only mapped ingredients, not the full recipe.

| Recipe and recipe-source reference | Ingredient coverage | Nutrition coverage | Allergen coverage | Status and remaining blockers |
|---|---|---|---|---|
| Masoor Dal — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/masoor-dal-recipe/) | 9 mapped / 18 source-listed; 9 unmapped; 1 exact and 8 approximate mapped quantities | Partial; mapped subset only | Partial (dairy declared; alternatives/cross-contact unresolved) | Estimated; ingredient matches and quantities are not verified; estimated yield; unmapped ingredients; no complete evidence set |
| Chana Masala — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/chana-masala/) | 9 / 20; 12 unmapped; 9 estimated quantities | Partial; mapped subset only | Partial (no complete allergen evidence) | Estimated; ingredient matches and quantities are not verified; unmapped ingredients; no complete evidence set |
| Rajma Masala — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/rajma-recipe/) | 11 / 18; 9 unmapped; 8 estimated quantities | Partial; mapped subset only | Partial (dairy declared; alternatives/cross-contact unresolved) | Estimated; ingredient matches and quantities are not verified; unmapped ingredients; no complete evidence set |
| Aloo Gobi — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/aloo-gobi-recipe/) | 9 / 19; 10 unmapped; 8 estimated quantities | Partial; mapped subset only | Partial (no complete allergen evidence) | Estimated; ingredient matches and quantities are not verified; unmapped ingredients; no complete evidence set |
| Vegetable Upma — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/upma-recipe/) | 8 / 18; 12 unmapped; 8 estimated quantities | Partial; mapped subset only | Partial (peanut, tree nut, and gluten declared; alternatives/cross-contact unresolved) | Estimated; ingredient matches and quantities are not verified; estimated yield; unmapped ingredients; no complete evidence set |
| Paneer Bhurji — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/paneer-bhurji-recipe/) | 9 / 15; 6 unmapped; 1 exact and 8 approximate mapped quantities | Partial; mapped subset only | Partial (dairy declared; alternatives/cross-contact unresolved) | Estimated; ingredient matches and quantities are not verified; unmapped ingredients; no complete evidence set |
| Palak Paneer — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/palak-paneer/) | 9 / 18; 8 unmapped; 7 estimated quantities | Partial; mapped subset only | Partial (dairy and tree nut declared; alternatives/cross-contact unresolved) | Estimated; ingredient matches and quantities are not verified; estimated yield; unmapped ingredients; no complete evidence set |
| Matar Paneer — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/matar-paneer/) | 12 / 25; 13 unmapped; 5 estimated quantities | Partial; mapped subset only | Partial (dairy and tree nut declared; alternatives/cross-contact unresolved) | Estimated; ingredient matches are not verified; unmapped ingredients; no complete evidence set |
| Coconut Milk Pulao — [Swasthi's Recipes](https://www.indianhealthyrecipes.com/coconut-milk-pulao/) | 8 mapped / source ingredient list not reviewed; 6 known unmapped; 8 estimated quantities | Partial; mapped subset only | Partial (tree nut declared; recipe composition and cross-contact unresolved) | Estimated; source recipe card, ingredient list, preparation, yield, and composition remain unchecked |

Across the reviewed source cards, source-stated serving counts do not verify the catalog's complete recipe quantities, ingredient matches, or nutrition. Every recipe still lacks a complete evidence set for composition, quantities, preparation, yield, dietary classification, and allergens. The catalog therefore keeps source references separate from nutrition citations and does not label these recipes verified.

The candidate Besan Chilla source was inspected but not added: its listed coriander has no mass quantity, its oil/ghee choice requires an ingredient-specific mapping, and recipe alternatives still need complete nutrition and allergen review. A published ingredient list alone does not establish ingredient nutrient values.

No ingredient records were added or improved. The existing per-100 g records cite USDA FoodData Central SR Legacy (April 2018) or FNDDS (October 2024); no IFCT values were imported because exact food records and values were not verified. Important remaining exact-identity gaps include chana dal, urad dal, curry leaves, asafoetida, kasuri methi, garam masala blends, bay leaf, amchur, and recipe-specific spice forms. Do not substitute chickpeas for chana dal, fenugreek seeds for fenugreek leaves, or ground spices for whole spices.

### Phase 5.6 pilot result

The Masoor Dal and Paneer Bhurji source pages were re-opened and their current canonical links recorded above. Masoor Dal lists 18 source ingredients: 9 have mapped ingredient records and 9 remain unmapped; among the mapped entries, 1 quantity is exact and 8 are approximate. Paneer Bhurji lists 15 source ingredients: 9 are mapped and 6 remain unmapped; 1 mapped quantity is exact and 8 are approximate. Both have zero missing numeric gram quantities within the mapped entries; the unmapped ingredients have no supported gram mappings for recipe nutrition. Thus, for each recipe, source ingredient count reconciles as mapped plus unmapped, and mapped quantity count reconciles as exact plus approximate plus missing.

The existing USDA records include dry red lentils (FDC 174284), paneer (FDC 2705740), raw tomato, raw garlic, fresh green chili, dried chili, coriander leaves, ground turmeric, and cumin seed. Ingredient records were not changed: recipe-to-record matches, preparation forms, and quantity bases are not fully evidenced for every mapping, and much of each source ingredient list has no exact supported mapping. Masoor's optional moong dal remains unmapped rather than being mapped to mung beans; Paneer Bhurji's ginger-garlic paste remains unmapped rather than combining two separately sourced ingredients.

Both pilot recipes remain estimated and are not recommendation-eligible. Each has partial nutrition and allergen coverage, incomplete source ingredient coverage, unmapped ingredients, and incomplete verification evidence. The calculator can calculate the mapped subset only; those totals are not asserted as complete prepared-recipe nutrition. Source recipe cards do not establish complete allergen absence, including ingredient alternatives and cross-contact. Meal recommendations and the daily plan continue to exclude both recipes. No ICMR-NIN IFCT nutrient values were imported, and no Firebase or user data was changed.

### Phase 5.7 ingredient database audit

The 73 existing ingredient records were checked before changes; IDs and normalized display names are unique. **No nutrient/ingredient records were added or changed.** The exported records now expose canonical per-100-g units, and validation rejects missing/mismatched units, unsupported nutrient keys, invalid nutrient values, duplicate IDs/names, and missing source references. Units are standardized by nutrient key (for example kcal, g, mg, and µg); they do not represent newly researched nutrient measurements.

USDA FoodData Central SR Legacy/FNDDS remain the only nutritional data sources used. No IFCT 2017 data was added because exact, reviewable record values for the remaining forms were not verified. USDA searches confirmed several requested forms are not safe to map from broad matches (for example, “curry leaves” results included other leaves); API demo-key rate limiting prevented completing every candidate search. No source IDs or values have been inferred from search snippets.

The unresolved recipe ingredient labels include chana dal, urad dal, optional moong dal, curry leaves, asafoetida, kasuri methi, garam masala, bay leaf, amchur, ginger-garlic paste, Kashmiri chili powder, mustard seeds in the required whole form, spice blends, alternative fats, and some whole-spice forms. Exact nutrition records already exist for fresh coriander leaves, fresh green chili, and cumin seeds; some recipe quantities/source-form matches using those records are nevertheless approximate or unverified. Fenugreek seed data is not mapped to kasuri methi, ground mustard seeds are not used as whole mustard seeds, and fresh ginger/garlic records are not combined into a paste.

The source-list row counts below were recalculated for all nine recipes. Chana Masala and Rajma Masala each previously mapped one source-listed ginger-garlic paste to separate fresh garlic and ginger records; those unsupported substitutions were removed. Nutrient records were not changed. Mapped counts are recipe-to-ingredient mapping records; unresolved counts are unresolved ingredient labels. They do not necessarily sum to source rows because a source row can contain alternatives, a compound ingredient, multiple ingredients, or repeated water quantities. Quantity counts do reconcile to mapped records as exact + approximate + missing.

| Recipe | Source rows | Mapped before → after | Unmapped before → after | Exact before → after | Approximate before → after | Missing quantities |
|---|---:|---:|---:|---:|---:|---:|
| Masoor Dal | 18 | 9 → 9 | 9 → 9 | 1 → 1 | 8 → 8 | 0 |
| Chana Masala | 20 | 9 → 7 | 12 → 13 | 0 → 0 | 9 → 7 | 0 |
| Rajma Masala | 18 | 11 → 9 | 9 → 9 | 3 → 3 | 8 → 6 | 0 |
| Aloo Gobi | 19 | 9 → 9 | 10 → 10 | 1 → 1 | 8 → 8 | 0 |
| Vegetable Upma | 18 | 8 → 8 | 12 → 12 | 0 → 0 | 8 → 8 | 0 |
| Paneer Bhurji | 15 | 9 → 9 | 6 → 6 | 1 → 1 | 8 → 8 | 0 |
| Palak Paneer | 18 | 9 → 9 | 8 → 8 | 2 → 2 | 7 → 7 | 0 |
| Matar Paneer | 25 | 12 → 12 | 13 → 13 | 7 → 7 | 5 → 5 | 0 |
| Coconut Milk Pulao | Not reviewed | 8 → 8 | 6 → 6 known | 0 → 0 | 8 → 8 | 0 |

A mapped record is not a verified recipe match. Existing incomplete source coverage, ingredient alternatives, approximate household measures, unresolved compound ingredients, and incomplete allergen metadata continue to block recommendation eligibility.

Run the frontend checks from `Vitals and Vitality/`:

```sh
npm test
npm run lint
npm run build
```
