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
* Google Fit REST integration in the Activity page (requires separate Google Cloud setup; see below)

## Firebase setup

The app requires a Firebase Web App configuration before registration or sign-in can be used. The web configuration values are client-side identifiers, not service-account credentials; access is restricted by Firebase Authentication and [firestore.rules](./firestore.rules).

1. Create a Firebase project in the Firebase Console. The app does not enable billing or paid services.
2. Register a Web App in the project and copy its configuration values.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. Create a Firestore database. Choose its location carefully; it cannot be changed after creation.
5. In **Firestore Database → Rules**, publish the contents of `firestore.rules`. The rules allow each signed-in user to read and update only their own `users/{uid}` profile document. Other collections, list queries, and profile deletion are denied.
6. Copy `.env.example` to `.env.local` in this project folder and fill in the `VITE_FIREBASE_*` values from the Web App settings. Keep `.env.local` private and never add service-account keys or client secrets to `VITE_` variables.
7. Restart the Vite development server, then register an account and complete the profile. The app loads the Firebase auth session on startup and saves profile changes to Firestore.

The stored user profile contains the account UID/email, onboarding fields (name, age, body measurements, goals, activity, diet and allergies, lifestyle details), completion state, and creation/update timestamps. Existing unauthenticated `vitalsProfile` browser data is not automatically copied into a new account, to avoid attaching one person's local health data to another account. Dashboard meal, hydration, activity, and weight logs remain in browser local storage in this phase; they are not yet account-synced.

If authentication or profile loading fails, check the browser message, Firebase Console provider/database configuration, and the published Firestore rules. No Firebase project credentials have been included in this repository.

## 🎯 Project Objective

The objective of this project is to bridge the gap between fitness tracking and nutrition management by creating a unified platform that automatically adjusts dietary recommendations based on a user's physical activity, health goals, and progress over time.

## Google Fit setup

The Activity page can read today's steps, distance, calories expended, and exercise sessions from Google Fit after the user grants read-only access. The Google OAuth access token is held in memory and is not saved to local storage. Today's summarized activity is stored locally with the rest of the dashboard data.

1. Create a Google Cloud project, enable the Google Fitness API, and configure the OAuth consent screen.
2. Create an OAuth client ID for a Web application. Add the exact app origin (for example, `http://localhost:5173`) to its authorized JavaScript origins. Add any production origin before deployment.
3. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_FIT_CLIENT_ID` to the client ID. A client ID is public configuration; never put a client secret in a `VITE_` variable.
4. Restart the Vite server, open **Activity**, then select **Connect Google Fit** and grant activity-read permission.

For OAuth testing, add the Google accounts that should be able to sign in as test users in the consent screen. The user can also log steps and workouts manually; both data sources refresh the activity-based meal suggestions.

Meal suggestions are examples filtered against the selected diet and known allergies. They are not medical advice; users should check ingredient labels and cross-contamination warnings.

## 📌 Future Enhancements

* Barcode-based food scanning
* Mobile application support
* Machine learning-based health predictions

## 👨‍💻 Author

Janendra Singh

Developed as a health-tech project to demonstrate full-stack development, API integration, data analytics, and personalized recommendation systems.
