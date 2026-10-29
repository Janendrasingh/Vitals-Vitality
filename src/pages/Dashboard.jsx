import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlus,
  Droplet,
  Dumbbell,
  Flame,
  LayoutDashboard,
  Leaf,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Utensils,
  Weight,
  X,
} from "lucide-react";
import { calculateNutrition } from "../components/step4/nutritionCalculator";
import { useFitnessIntegration } from "../fitness/useFitnessIntegration";
import "./Dashboard.css";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "meals", label: "Meal Planner", icon: CalendarDays },
  { id: "recipes", label: "Recipes", icon: Utensils },
  { id: "activity", label: "Activity", icon: Dumbbell },
  { id: "progress", label: "Progress", icon: Flame },
];

const setupNavigation = [
  { label: "Profile & goals", step: 1 },
  { label: "Diet & allergies", step: 2 },
  { label: "Lifestyle", step: 3 },
  { label: "Nutrition summary", step: 4 },
];

const mealLibrary = [
  {
    id: "chicken-rice",
    name: "Chicken & brown rice bowl",
    description: "Grilled chicken, brown rice, spinach and roasted peppers",
    calories: 540,
    protein: 42,
    carbs: 58,
    fat: 14,
    tags: ["omnivore", "gluten-free"],
    allergens: [],
    workout: "strength",
  },
  {
    id: "tofu-quinoa",
    name: "Tofu quinoa power bowl",
    description: "Crispy tofu, quinoa, edamame and greens",
    calories: 510,
    protein: 28,
    carbs: 62,
    fat: 17,
    tags: ["vegan", "vegetarian", "gluten-free"],
    allergens: ["soy"],
    workout: "strength",
  },
  {
    id: "salmon-potato",
    name: "Salmon & sweet potato",
    description: "Baked salmon, sweet potato and broccoli",
    calories: 590,
    protein: 38,
    carbs: 54,
    fat: 23,
    tags: ["omnivore", "gluten-free", "paleo"],
    allergens: ["fish"],
    workout: "cardio",
  },
  {
    id: "lentil-wrap",
    name: "Lentil & avocado wrap",
    description: "Lentils, avocado, crunchy greens in a gluten-free wrap",
    calories: 470,
    protein: 20,
    carbs: 56,
    fat: 18,
    tags: ["vegan", "vegetarian", "gluten-free"],
    allergens: [],
    workout: "cardio",
  },
  {
    id: "egg-salad",
    name: "Egg & avocado salad",
    description: "Eggs, avocado, cucumber and leafy greens",
    calories: 390,
    protein: 24,
    carbs: 16,
    fat: 27,
    tags: ["vegetarian", "keto", "gluten-free", "paleo"],
    allergens: ["egg"],
    workout: "recovery",
  },
  {
    id: "chickpea-salad",
    name: "Chickpea crunch salad",
    description: "Chickpeas, cucumber, tomato and lemon-herb dressing",
    calories: 430,
    protein: 18,
    carbs: 57,
    fat: 15,
    tags: ["vegan", "vegetarian", "gluten-free"],
    allergens: [],
    workout: "recovery",
  },
  {
    id: "turkey-lettuce",
    name: "Turkey lettuce cups",
    description: "Lean turkey, lettuce, cucumber and sesame-free herbs",
    calories: 360,
    protein: 35,
    carbs: 12,
    fat: 19,
    tags: ["omnivore", "keto", "gluten-free", "paleo"],
    allergens: [],
    workout: "strength",
  },
  {
    id: "oat-yogurt",
    name: "Berry oat yogurt bowl",
    description: "Oats, berries, yogurt and pumpkin seeds",
    calories: 410,
    protein: 22,
    carbs: 52,
    fat: 12,
    tags: ["vegetarian"],
    allergens: ["dairy", "gluten"],
    workout: "cardio",
  },
];

const workoutOptions = [
  { id: "strength", label: "Strength training", met: 5 },
  { id: "cardio", label: "Cardio / running", met: 8 },
  { id: "cycling", label: "Cycling", met: 7 },
  { id: "yoga", label: "Yoga / mobility", met: 3 },
  { id: "walking", label: "Walking", met: 3.5 },
];

function getTodayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function emptyDashboardState() {
  return {
    date: getTodayKey(),
    meals: [],
    waterGlasses: 0,
    weightEntries: [],
    workouts: [],
    steps: 0,
  };
}

function readDashboardState(userId) {
  const savedState = localStorage.getItem(`vitalsDashboard:${userId}`);
  if (!savedState) return emptyDashboardState();

  const parsedState = JSON.parse(savedState);
  if (parsedState.date !== getTodayKey()) {
    return {
      ...emptyDashboardState(),
      weightEntries: Array.isArray(parsedState.weightEntries) ? parsedState.weightEntries : [],
    };
  }

  const savedDashboardData = Object.fromEntries(
    Object.entries(parsedState).filter(([key]) => key !== "fitMetrics")
  );
  return {
    ...emptyDashboardState(),
    ...savedDashboardData,
    meals: Array.isArray(parsedState.meals) ? parsedState.meals : [],
    workouts: Array.isArray(parsedState.workouts) ? parsedState.workouts : [],
    weightEntries: Array.isArray(parsedState.weightEntries) ? parsedState.weightEntries : [],
    waterGlasses: Number.isInteger(parsedState.waterGlasses)
      ? Math.min(Math.max(parsedState.waterGlasses, 0), 10)
      : 0,
    steps: Math.max(Number(parsedState.steps) || 0, 0),
  };
}

function firstName(data) {
  return data?.fullName?.trim().split(/\s+/)[0] || "there";
}

function matchesAllergy(meal, allergies) {
  const allergyAliases = {
    dairy: ["dairy", "milk", "lactose"],
    peanut: ["peanut"],
    shellfish: ["shellfish", "shrimp", "crab", "lobster"],
    soy: ["soy"],
    egg: ["egg"],
    fish: ["fish"],
    gluten: ["gluten", "wheat"],
    sesame: ["sesame"],
    honey: ["honey"],
  };
  return allergies.some((item) => {
    const allergy = item.toLowerCase().trim();
    const matchedCategory = Object.entries(allergyAliases).find(([, aliases]) =>
      aliases.some((alias) => allergy.includes(alias))
    );
    if (!matchedCategory) return true;
    return meal.allergens.includes(matchedCategory[0]);
  });
}

function getDietKeys(diets) {
  return diets
    .map((diet) => diet.toLowerCase())
    .filter((diet) => ["vegan", "keto", "paleo", "gluten-free"].includes(diet));
}

function satisfiesDiets(meal, diets) {
  return diets.every((diet) => meal.tags.includes(diet));
}

function getActivitySummary(workouts, steps, fitnessDaily, fitnessWorkouts) {
  const importedWorkouts = fitnessWorkouts.map((workout) => ({
    id: `${workout.provider}-${workout.sourceWorkoutId}`,
    provider: workout.provider,
    label: workout.activityType === "unknown" ? "Imported workout" : workout.activityType,
    type: recommendationWorkoutType(workout.activityType),
    minutes: workout.durationMinutes,
    calories: workout.activeCaloriesKcal,
    averageHeartRateBpm: workout.averageHeartRateBpm,
    steps: null,
    time: workout.endTimeMs,
  }));
  const allWorkouts = [...workouts, ...importedWorkouts].sort((a, b) => a.time - b.time);
  const manualWorkoutMinutes = workouts.reduce((total, workout) => total + workout.minutes, 0);
  const workoutMinutes = fitnessDaily?.workoutDurationMinutes ?? manualWorkoutMinutes;
  const activeCaloriesKcal = fitnessDaily?.activeCaloriesKcal ?? null;
  const reportedSteps = fitnessDaily?.steps ?? (steps > 0 ? steps : null);
  const effectiveSteps = reportedSteps ?? 0;
  const stepsSource = fitnessDaily?.steps !== null && fitnessDaily?.steps !== undefined
    ? "imported"
    : steps > 0
      ? "manual"
      : "none";
  const intensity = (activeCaloriesKcal ?? 0) >= 350 || workoutMinutes >= 50 || (effectiveSteps ?? 0) >= 10000
    ? "high"
    : (activeCaloriesKcal ?? 0) >= 150 || workoutMinutes >= 20 || (effectiveSteps ?? 0) >= 5000
      ? "moderate"
      : "light";
  return {
    activeCaloriesKcal,
    workoutMinutes,
    steps: effectiveSteps,
    stepsAvailable: reportedSteps !== null,
    stepsSource,
    intensity,
    allWorkouts,
  };
}

function recommendationWorkoutType(activityType) {
  const type = activityType.toLowerCase();
  if (/(strength|weight|resistance)/.test(type)) return "strength";
  if (/(run|walk|cycl|cardio|hike)/.test(type)) return "cardio";
  return "recovery";
}

function getMealSuggestions({ diets, allergies, activity, workouts }) {
  const dietKeys = getDietKeys(diets);
  const latestWorkout = activity.allWorkouts.at(-1) || workouts.at(-1);
  const workoutType = latestWorkout?.type === "strength"
    ? "strength"
    : latestWorkout && ["cardio", "cycling", "walking"].includes(latestWorkout.type)
      ? "cardio"
      : "recovery";
  const preference = dietKeys.length ? `${dietKeys.join(", ")} ` : "";
  const focus = activity.intensity === "high"
    ? "high-activity"
    : activity.intensity === "moderate"
      ? "active-day"
      : "balanced";
  const eligible = mealLibrary.filter((meal) => {
    if (!satisfiesDiets(meal, dietKeys)) return false;
    if (matchesAllergy(meal, allergies)) return false;
    return true;
  });
  const sorted = [...eligible].sort((a, b) => {
    const aFit = a.workout === workoutType ? 1 : 0;
    const bFit = b.workout === workoutType ? 1 : 0;
    return bFit - aFit || b.protein - a.protein;
  });
  return {
    focus,
    title: activity.intensity === "high"
      ? "Refuel after your active day"
      : activity.intensity === "moderate"
        ? "Support your movement today"
        : "A balanced meal for today",
    subtitle: latestWorkout
      ? `Based on your ${latestWorkout.label.toLowerCase()} session${activity.stepsAvailable ? ` and ${activity.steps.toLocaleString()} steps` : ""}.`
      : activity.stepsAvailable
        ? `Based on ${activity.steps.toLocaleString()} steps and your ${preference || ""}profile preferences.`
        : `Based on your ${preference || ""}profile preferences; no synced step count is available.`,
    meals: sorted.slice(0, 3),
  };
}

function getMealCalories(meals) {
  return meals.reduce((total, meal) => total + (Number(meal.calories) || 0), 0);
}

function DashboardModal({ mode, onClose, onSubmit, currentWeight }) {
  const [values, setValues] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    weight: currentWeight ? String(currentWeight) : "",
    type: "strength",
    minutes: "",
    steps: "",
  });
  const isMeal = mode === "meal";
  const isWeight = mode === "weight";
  const title = isMeal ? "Log a meal" : isWeight ? "Log your weight" : "Log activity";
  const update = (field) => (event) => setValues((previous) => ({ ...previous, [field]: event.target.value }));

  function handleSubmit(event) {
    event.preventDefault();
    if (isMeal) {
      onSubmit({
        name: values.name.trim(),
        calories: Number(values.calories),
        protein: Number(values.protein) || 0,
        carbs: Number(values.carbs) || 0,
        fat: Number(values.fat) || 0,
      });
    } else if (isWeight) {
      onSubmit({ weight: Number(values.weight) });
    } else {
      const option = workoutOptions.find((item) => item.id === values.type);
      const minutes = Number(values.minutes);
      const calories = Math.round((option?.met || 4) * (Number(currentWeight) || 70) * (minutes / 60));
      onSubmit({
        type: values.type,
        label: option?.label || "Activity",
        minutes,
        calories,
        steps: Number(values.steps) || 0,
      });
    }
  }

  return (
    <div className="dashboard-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="dashboard-modal-title"
        aria-modal="true"
        className="dashboard-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
              {isMeal ? "Meal tracker" : isWeight ? "Progress tracker" : "Activity tracker"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900" id="dashboard-modal-title">{title}</h2>
          </div>
          <button aria-label="Close dialog" className="dashboard-icon-button" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isMeal ? (
            <>
              <label className="dashboard-field">Meal name<input autoFocus onChange={update("name")} required value={values.name} /></label>
              <label className="dashboard-field">Calories<input min="1" onChange={update("calories")} required type="number" value={values.calories} /></label>
              <p className="dashboard-modal-hint">Add macros if you know them; totals use only values you enter.</p>
              <div className="dashboard-macro-inputs">
                <label className="dashboard-field">Protein (g)<input min="0" onChange={update("protein")} type="number" value={values.protein} /></label>
                <label className="dashboard-field">Carbs (g)<input min="0" onChange={update("carbs")} type="number" value={values.carbs} /></label>
                <label className="dashboard-field">Fat (g)<input min="0" onChange={update("fat")} type="number" value={values.fat} /></label>
              </div>
            </>
          ) : isWeight ? (
            <label className="dashboard-field">Weight (kg)<input autoFocus min="1" onChange={update("weight")} required step="0.1" type="number" value={values.weight} /></label>
          ) : (
            <>
              <label className="dashboard-field">
                Activity
                <select onChange={update("type")} value={values.type}>
                  {workoutOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label className="dashboard-field">Duration (minutes)<input autoFocus min="1" onChange={update("minutes")} required type="number" value={values.minutes} /></label>
              <label className="dashboard-field">Steps from this activity (optional)<input min="0" onChange={update("steps")} type="number" value={values.steps} /></label>
            </>
          )}
          <button className="dashboard-primary-button w-full justify-center" type="submit">
            <Check size={18} />
            Save {isMeal ? "meal" : isWeight ? "weight" : "activity"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function Dashboard({
  userData,
  setUserData,
  onEditStep,
  userId,
  onSignOut,
  accountEmail,
  profileSaveStatus,
  profileSaveError,
  accountError,
  onRetryProfileSave,
}) {
  const nutrition = useMemo(() => calculateNutrition(userData), [userData]);
  const [dashboardData, setDashboardData] = useState(() => readDashboardState(userId));
  const [view, setView] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fitness = useFitnessIntegration(userId);
  const { meals, waterGlasses, weightEntries, workouts, steps } = dashboardData;
  const calorieGoal = nutrition.calories;
  const consumed = getMealCalories(meals);
  const caloriesLeft = Math.max(calorieGoal - consumed, 0);
  const calorieProgress = calorieGoal ? Math.min((consumed / calorieGoal) * 100, 100) : 0;
  const consumedMacros = meals.reduce(
    (total, meal) => ({
      protein: total.protein + (Number(meal.protein) || 0),
      carbs: total.carbs + (Number(meal.carbs) || 0),
      fat: total.fat + (Number(meal.fat) || 0),
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );
  const displayName = firstName(userData);
  const diets = (Array.isArray(userData?.diets) ? userData.diets : []).filter(Boolean);
  const allergies = [...(userData?.allergies || []), ...(userData?.customAllergies || [])].filter(Boolean);
  const activity = getActivitySummary(workouts, steps, fitness.daily, fitness.workouts);
  const suggestions = getMealSuggestions({ diets, allergies, activity, workouts });
  const targetWeight = Number(userData?.targetWeight) || 0;
  const currentWeight = Number(userData?.weight) || 0;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const proteinGoal = nutrition.protein;
  const carbsGoal = nutrition.carbs;
  const fatGoal = nutrition.fat;

  useEffect(() => {
    localStorage.setItem(`vitalsDashboard:${userId}`, JSON.stringify(dashboardData));
  }, [dashboardData, userId]);

  function selectView(id) {
    setView(id);
    setMobileMenuOpen(false);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigateSetup(step) {
    onEditStep(step);
    setMobileMenuOpen(false);
  }

  function saveEntry(entry) {
    const date = getTodayKey();
    if (modal === "meal") {
      setDashboardData((previous) => ({ ...previous, date, meals: [...previous.meals, { ...entry, id: Date.now() }] }));
      setNotice(`${entry.name} added to today's meal log.`);
    } else if (modal === "weight") {
      setDashboardData((previous) => ({
        ...previous,
        date,
        weightEntries: [...previous.weightEntries, { weight: entry.weight, time: Date.now() }],
      }));
      setUserData((previous) => ({ ...previous, weight: String(entry.weight) }));
      setNotice(`Weight updated to ${entry.weight} kg.`);
    } else {
      setDashboardData((previous) => ({
        ...previous,
        date,
        steps: previous.steps + entry.steps,
        workouts: [...previous.workouts, { ...entry, id: Date.now(), time: Date.now() }],
      }));
      setNotice(`${entry.label} added. Meal suggestions updated for your activity.`);
    }
    setModal(null);
  }

  function addSuggestedMeal(meal) {
    setDashboardData((previous) => ({
      ...previous,
      date: getTodayKey(),
      meals: [...previous.meals, { ...meal, id: Date.now(), suggested: true }],
    }));
    setNotice(`${meal.name} added to today's meal log.`);
  }

  function addWater() {
    setDashboardData((previous) => ({ ...previous, date: getTodayKey(), waterGlasses: Math.min(previous.waterGlasses + 1, 10) }));
  }

  const navControls = (className) => (
    <nav aria-label={className === "dashboard-topnav" || className === "dashboard-mobile-nav" ? "Main navigation" : "Dashboard sections"} className={className}>
      {navigation.map(({ id, label, icon: Icon }) => (
        <button
          aria-current={view === id ? "page" : undefined}
          className={`${className === "dashboard-topnav" || className === "dashboard-mobile-nav" ? "dashboard-topnav-link" : "dashboard-side-link"}${view === id ? " is-active" : ""}`}
          key={id}
          onClick={() => selectView(id)}
          type="button"
        >
          {(className === "dashboard-side-nav" || className === "dashboard-mobile-nav") && <Icon aria-hidden="true" size={18} />}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <button aria-label="Open dashboard" className="dashboard-brand" onClick={() => selectView("dashboard")} type="button">
          Vitals &amp; Vitality
        </button>
        {navControls("dashboard-topnav")}
        <div className="dashboard-top-actions">
          <span aria-live="polite" className="hidden text-xs text-slate-500 xl:inline" title={profileSaveError || accountEmail}>
            {profileSaveStatus === "saving" ? "Saving profile…" : profileSaveStatus === "error" ? "Profile save failed" : "Profile saved"}
          </span>
          {profileSaveStatus === "error" && (
            <button className="text-xs font-semibold text-red-700 hover:text-red-800" onClick={onRetryProfileSave} type="button">Retry save</button>
          )}
          <button className="dashboard-primary-button desktop-log-meal" onClick={() => setModal("meal")} type="button">
            <Plus size={17} /> Log Meal
          </button>
          <button aria-label="Notifications" className="dashboard-icon-button" onClick={() => setNotice("You're all caught up. Keep following your personalized plan.")} type="button">
            <Bell size={19} />
          </button>
          <button aria-label="Edit profile settings" className="dashboard-icon-button" onClick={() => navigateSetup(1)} type="button">
            <Settings size={19} />
          </button>
          <button aria-label={`Edit ${displayName}'s profile`} className="dashboard-avatar" onClick={() => navigateSetup(1)} type="button">
            {displayName.charAt(0).toUpperCase()}
          </button>
          <button aria-label={`Sign out${accountEmail ? ` ${accountEmail}` : ""}`} className="dashboard-icon-button" onClick={onSignOut} type="button" title={`Sign out${accountEmail ? ` of ${accountEmail}` : ""}`}>
            <LogOut size={18} />
          </button>
          <button aria-expanded={mobileMenuOpen} aria-label="Toggle dashboard menu" className="dashboard-mobile-menu" onClick={() => setMobileMenuOpen((open) => !open)} type="button">
            <LayoutDashboard size={19} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="dashboard-mobile-menu-panel">
            {navControls("dashboard-mobile-nav")}
            <button className="dashboard-topnav-link flex items-center gap-2" onClick={onSignOut} type="button"><LogOut size={16} /> Sign out</button>
          </div>
        )}
      </header>

      <aside className="dashboard-sidebar">
        <div className="dashboard-profile">
          <strong>{displayName}</strong>
          <span>{calorieGoal ? `Goal: ${calorieGoal.toLocaleString()} kcal` : "Complete your profile for a calorie target"}</span>
          <span className="dashboard-sidebar-goal">{userData?.goal || userData?.lifestyleGoal || "Build healthy habits"}</span>
        </div>
        {navControls("dashboard-side-nav")}
        <div className="dashboard-side-divider" />
        <p className="dashboard-side-heading">Your setup</p>
        <nav aria-label="Edit your setup" className="dashboard-setup-nav">
          {setupNavigation.map(({ label, step }) => (
            <button className="dashboard-side-link" key={step} onClick={() => navigateSetup(step)} type="button">{label}</button>
          ))}
        </nav>
        <div className="dashboard-sidebar-tip"><Leaf size={18} /><p>Small steps add up. Keep showing up for yourself.</p></div>
      </aside>

      <main className="dashboard-main">
        {accountError && (
          <p aria-live="assertive" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {accountError}
          </p>
        )}
        {profileSaveStatus === "error" && (
          <p aria-live="assertive" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {profileSaveError || "Profile changes could not be saved."}{" "}
            <button className="font-semibold underline" onClick={onRetryProfileSave} type="button">Try again</button>
          </p>
        )}
        {view === "dashboard" && (
          <DashboardHome
            activity={activity}
            addSuggestedMeal={addSuggestedMeal}
            addWater={addWater}
            caloriesLeft={caloriesLeft}
            calorieGoal={calorieGoal}
            calorieProgress={calorieProgress}
            consumedMacros={consumedMacros}
            allergies={allergies}
            diets={diets}
            displayName={displayName}
            fatGoal={fatGoal}
            meals={meals}
            notice={notice}
            onLogMeal={() => setModal("meal")}
            proteinGoal={proteinGoal}
            suggestions={suggestions}
            today={today}
            waterGlasses={waterGlasses}
            carbsGoal={carbsGoal}
          />
        )}
        {view === "meals" && (
          <MealPlannerPage
            addSuggestedMeal={addSuggestedMeal}
            meals={meals}
            onLogMeal={() => setModal("meal")}
            suggestions={suggestions}
            calorieGoal={calorieGoal}
            consumed={consumed}
          />
        )}
        {view === "recipes" && <RecipesPage allergies={allergies} diets={diets} onAddMeal={addSuggestedMeal} />}
        {view === "activity" && (
          <ActivityPage
            activity={activity}
            fitness={fitness}
            onLogWorkout={() => setModal("workout")}
            workouts={activity.allWorkouts}
          />
        )}
        {view === "progress" && (
          <ProgressPage
            currentWeight={currentWeight}
            onLogWeight={() => setModal("weight")}
            targetWeight={targetWeight}
            userData={userData}
            weightEntries={weightEntries}
            activity={activity}
          />
        )}
      </main>
      {notice && view !== "dashboard" && <p aria-live="polite" className="dashboard-toast">{notice}</p>}
      {modal && <DashboardModal currentWeight={currentWeight} mode={modal} onClose={() => setModal(null)} onSubmit={saveEntry} />}
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <section className="dashboard-welcome dashboard-page-header">
      <div>
        <p className="dashboard-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="dashboard-welcome-actions">{action}</div>}
    </section>
  );
}

function DashboardHome({
  activity, addSuggestedMeal, addWater, caloriesLeft, calorieGoal, calorieProgress, consumedMacros,
  allergies, diets, displayName, fatGoal, meals, notice, onLogMeal, proteinGoal, suggestions, today, waterGlasses, carbsGoal,
}) {
  return (
    <>
      <PageHeader
        action={<button className="dashboard-primary-button" onClick={onLogMeal} type="button"><CirclePlus size={18} /> Log Meal</button>}
        description={calorieGoal ? `You've reached ${Math.round(calorieProgress)}% of your daily target. Keep it up!` : "Finish your profile to get a nutrition target tailored to you."}
        eyebrow={today}
        title={`Good morning, ${displayName}.`}
      />
      <section aria-label="Daily nutrition and hydration" className="dashboard-overview-grid">
        <article className="dashboard-nutrition-card">
          <div
            aria-label={calorieGoal ? `${caloriesLeft.toLocaleString()} calories left of ${calorieGoal.toLocaleString()}` : "Set up your profile to calculate calorie needs"}
            className="dashboard-calorie-ring"
            role="img"
            style={{ "--progress": `${calorieProgress}%` }}
          >
            <div className="dashboard-calorie-ring-inner">
              <strong>{calorieGoal ? caloriesLeft.toLocaleString() : "--"}</strong>
              <span>{calorieGoal ? "KCAL LEFT" : "SET GOAL"}</span>
            </div>
          </div>
          <div className="dashboard-nutrients">
            <h2>Nutrient<br />Breakdown</h2>
            <NutrientProgress label="Protein" current={consumedMacros.protein} target={proteinGoal} color="green" />
            <NutrientProgress label="Carbs" current={consumedMacros.carbs} target={carbsGoal} color="orange" />
            <NutrientProgress label="Fat" current={consumedMacros.fat} target={fatGoal} color="olive" />
          </div>
        </article>
        <article className="dashboard-hydration-card">
          <Droplet className="hydration-header-icon" fill="currentColor" size={25} />
          <h2>Stay Hydrated</h2>
          <p>{waterGlasses} of 10 glasses today</p>
          <div aria-label={`${waterGlasses} of 10 glasses`} className="dashboard-water-glasses">
            {Array.from({ length: 10 }, (_, index) => (
              <span className={index < waterGlasses ? "water-glass is-filled" : "water-glass"} key={index}>
                <Droplet fill={index < waterGlasses ? "currentColor" : "none"} size={15} />
              </span>
            ))}
          </div>
          <button className="dashboard-water-button" disabled={waterGlasses >= 10} onClick={addWater} type="button">
            {waterGlasses >= 10 ? "Daily water goal reached" : "Add 250ml Glass"}
          </button>
        </article>
      </section>
      <section aria-labelledby="meal-log-title" className="dashboard-meal-section">
        <div className="dashboard-section-heading">
          <div><p className="dashboard-eyebrow">{meals.length} meals logged · {activity.stepsAvailable ? `${activity.stepsSource === "manual" ? "manual " : ""}${activity.steps.toLocaleString()} steps` : "no step data"}</p><h2 id="meal-log-title">Today&apos;s Meal Log</h2></div>
          <span className="dashboard-meal-summary">{getMealCalories(meals).toLocaleString()} kcal eaten</span>
        </div>
        {meals.length ? (
          <div className="dashboard-meal-grid">
            {meals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
            <button className="dashboard-add-meal-card" onClick={onLogMeal} type="button">
              <span className="dashboard-add-meal-icon"><Utensils size={20} /></span><strong>Log Next Meal</strong><span>Add a meal or snack</span><span className="dashboard-add-meal-action"><Plus size={15} /> Add meal</span>
            </button>
          </div>
        ) : (
          <div className="dashboard-empty-meals">
            <span className="dashboard-add-meal-icon"><Utensils size={20} /></span>
            <div><strong>No meals logged yet</strong><p>Choose a personalized suggestion below or log what you ate.</p></div>
            <button className="dashboard-secondary-button" onClick={onLogMeal} type="button"><Plus size={16} /> Log a meal</button>
          </div>
        )}
      </section>
      <section aria-labelledby="suggestions-title" className="dashboard-meal-section dashboard-suggestions-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-eyebrow"><Sparkles size={13} /> Personalized from today&apos;s activity &amp; your food preferences</p>
            <h2 id="suggestions-title">{suggestions.title}</h2>
            <p className="dashboard-section-subtitle">{suggestions.subtitle}</p>
          </div>
          <span className="dashboard-activity-pill"><Flame size={15} /> {activity.activeCaloriesKcal === null ? "--" : activity.activeCaloriesKcal} active kcal</span>
        </div>
        {suggestions.meals.length ? (
          <div className="dashboard-suggestion-grid">
            {suggestions.meals.map((meal) => (
              <article className="dashboard-suggestion-card" key={meal.id}>
                <span className="dashboard-suggestion-badge">{meal.workout === "strength" ? "Protein recovery" : meal.workout === "cardio" ? "Energy replenishment" : "Balanced pick"}</span>
                <h3>{meal.name}</h3>
                <p>{meal.description}</p>
                <div className="dashboard-suggestion-macros">
                  <strong>{meal.calories} <span>kcal</span></strong>
                  <span>{meal.protein}g protein</span><span>{meal.carbs}g carbs</span>
                </div>
                <button className="dashboard-text-action" onClick={() => addSuggestedMeal(meal)} type="button">Add to today&apos;s log <ChevronRight size={15} /></button>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-meals">
            <p>No suggestions match your current diet and allergy selections. Review your preferences or log a meal manually.</p>
          </div>
        )}
        {notice && <p aria-live="polite" className="dashboard-feedback">{notice}</p>}
        <p className="dashboard-filter-note">
          <Leaf size={14} />
          {diets.length || allergies.length
            ? `Filtered for ${[...diets, ...allergies].join(", ")}.`
            : "Set a dietary preference to further personalize suggestions."}
          {" "}Check ingredients and allergen labels before eating.
        </p>
      </section>
    </>
  );
}

function MealCard({ meal }) {
  return (
    <article className="dashboard-meal-card">
      <div className="dashboard-meal-image dashboard-meal-image-empty"><span>{meal.suggested ? "Suggested" : "Logged today"}</span></div>
      <div className="dashboard-meal-details">
        <div><h3>{meal.name}</h3><p>P {meal.protein || 0}g · C {meal.carbs || 0}g · F {meal.fat || 0}g</p></div>
        <strong>{meal.calories}<span>kcal</span></strong>
      </div>
    </article>
  );
}

function MealPlannerPage({ addSuggestedMeal, meals, onLogMeal, suggestions, calorieGoal, consumed }) {
  return (
    <>
      <PageHeader
        action={<button className="dashboard-primary-button" onClick={onLogMeal} type="button"><CirclePlus size={18} /> Log Meal</button>}
        description="A flexible plan based on your nutrition goals, food preferences, and activity today."
        eyebrow="Your daily plan"
        title="Meal Planner"
      />
      <div className="dashboard-stat-strip">
        <StatCard label="Daily calorie goal" value={calorieGoal ? `${calorieGoal.toLocaleString()} kcal` : "Set profile"} />
        <StatCard label="Logged today" value={`${consumed.toLocaleString()} kcal`} />
        <StatCard label="Meals logged" value={String(meals.length)} />
      </div>
      <section className="dashboard-data-section">
        <SectionHeading eyebrow="Recommended next" title={suggestions.title} />
        <p className="dashboard-section-subtitle">{suggestions.subtitle}</p>
        <div className="dashboard-suggestion-grid">
          {suggestions.meals.map((meal) => (
            <article className="dashboard-suggestion-card" key={meal.id}>
              <span className="dashboard-suggestion-badge">{meal.workout === "strength" ? "Protein recovery" : "Activity support"}</span>
              <h3>{meal.name}</h3><p>{meal.description}</p>
              <div className="dashboard-suggestion-macros"><strong>{meal.calories} <span>kcal</span></strong><span>{meal.protein}g protein</span><span>{meal.carbs}g carbs</span></div>
              <button className="dashboard-text-action" onClick={() => addSuggestedMeal(meal)} type="button">Add to today&apos;s log <ChevronRight size={15} /></button>
            </article>
          ))}
        </div>
      </section>
      <section className="dashboard-data-section">
        <SectionHeading eyebrow={`${meals.length} meals`} title="Today&apos;s log" />
        {meals.length ? <div className="dashboard-meal-grid">{meals.map((meal) => <MealCard key={meal.id} meal={meal} />)}</div> : <EmptyState text="Your meal log is empty. Add a recommendation or log your own meal." action={onLogMeal} actionLabel="Log a meal" />}
      </section>
    </>
  );
}

function RecipesPage({ allergies, diets, onAddMeal }) {
  const meals = mealLibrary.filter((meal) => {
    return satisfiesDiets(meal, getDietKeys(diets)) && !matchesAllergy(meal, allergies);
  });
  return (
    <>
      <PageHeader description="Recipes are filtered using the diet and allergy information from your setup." eyebrow="Cook something good" title="Recipes" />
      <section className="dashboard-data-section">
        <div className="dashboard-section-heading">
          <div><p className="dashboard-eyebrow">Personalized picks</p><h2>Recipes for your preferences</h2></div>
          <span className="dashboard-meal-summary">{meals.length} recipes</span>
        </div>
        {meals.length ? (
          <div className="dashboard-suggestion-grid">
            {meals.map((meal) => (
              <article className="dashboard-suggestion-card" key={meal.id}>
                <span className="dashboard-suggestion-badge">{meal.protein}g protein · {meal.calories} kcal</span>
                <h3>{meal.name}</h3><p>{meal.description}</p>
                <div className="dashboard-recipe-tags">{meal.tags.filter((tag) => tag !== "omnivore").map((tag) => <span className="dashboard-tag" key={tag}>{tag}</span>)}</div>
                <button className="dashboard-text-action" onClick={() => onAddMeal(meal)} type="button">Add to today&apos;s log <ChevronRight size={15} /></button>
              </article>
            ))}
          </div>
        ) : <EmptyState text="No recipes match the current diet and allergy preferences. Update your preferences to see more recipes." />}
      </section>
    </>
  );
}

function ActivityPage({ activity, fitness, onLogWorkout, workouts }) {
  const { connectionStatus, syncStatus, error, providerAvailable, daily, integration, lastSyncedAt } = fitness;
  const statusLabel = fitness.loading
    ? "Checking connection"
    : syncStatus === "denied"
      ? "Permission denied"
      : connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "expired"
        ? "Connection expired"
        : providerAvailable
          ? "Not connected"
          : "Setup required";
  const statusClass = connectionStatus === "connected" ? "connected" : connectionStatus === "expired" || syncStatus === "failed" || syncStatus === "denied" ? "error" : "";
  const syncLabel = {
    connecting: "Requesting permissions…",
    syncing: "Synchronizing…",
    success: "Sync successful",
    empty: "No data available",
    denied: "Permission denied",
    failed: "Synchronization failed",
  }[syncStatus];
  const displayMetric = (value, suffix = "") => value === null || value === undefined ? "--" : `${value.toLocaleString()}${suffix}`;
  const canDisconnect = providerAvailable && connectionStatus === "connected";
  const canSync = providerAvailable && !fitness.loading && !["connecting", "syncing", "disconnecting"].includes(syncStatus);

  return (
    <>
      <PageHeader action={<button className="dashboard-primary-button" onClick={onLogWorkout} type="button"><Plus size={17} /> Log activity</button>} description="Imported activity and your manual logs can inform today's meal suggestions. Provider data is shown only when the connected source supplies it." eyebrow="Movement & recovery" title="Activity" />
      <div className="dashboard-stat-strip">
        <StatCard label={activity.stepsSource === "imported" ? "Imported steps today" : activity.stepsSource === "manual" ? "Manual steps today" : "Steps today"} value={activity.stepsAvailable ? activity.steps.toLocaleString() : "--"} />
        <StatCard label="Active calories (imported)" value={displayMetric(daily?.activeCaloriesKcal, " kcal")} />
        <StatCard label="Workout duration" value={daily?.workoutDurationMinutes !== null && daily?.workoutDurationMinutes !== undefined ? `${daily.workoutDurationMinutes} min` : "--"} />
      </div>
      <section className="dashboard-data-section">
        <SectionHeading eyebrow="Fitness provider" title="Google Health API" />
        <article className="dashboard-fit-card">
          <div className="dashboard-fit-icon"><Activity size={24} /></div>
          <div className="dashboard-fit-content">
            <div className="dashboard-fit-title-row"><h3>Google Health</h3><span className={`dashboard-fit-status ${statusClass}`}>{statusLabel}</span></div>
            <p>With your consent, read-only activity access can include steps, active energy burned, exercise sessions, and distance from data available to your Google Health account. Active calories are not total daily energy expenditure.</p>
            {!providerAvailable && <p className="dashboard-fit-last-sync">Google Health server configuration is not available yet. Complete the Firebase Functions and Google OAuth setup before connecting. No provider connection is simulated.</p>}
            {providerAvailable && connectionStatus !== "connected" && <p className="dashboard-fit-last-sync">Google will ask you to authorize the activity-and-fitness read-only scope. The first sync imports the last 7 days; later syncs are user initiated.</p>}
            {connectionStatus === "connected" && (
              <>
                <p className="dashboard-fit-last-sync">
                  {lastSyncedAt ? `Last synchronized ${lastSyncedAt.toLocaleString()}` : "Connected; no successful sync recorded yet."}
                  {integration?.permissions?.length ? ` · Permissions: ${integration.permissions.join(", ")}` : ""}
                </p>
                <p className="dashboard-fit-last-sync">
                  Today: {displayMetric(daily?.steps, " steps")} · {displayMetric(daily?.activeCaloriesKcal, " active kcal")} · {daily?.distanceMeters == null ? "--" : `${(daily.distanceMeters / 1000).toFixed(2)} km`} · {displayMetric(daily?.averageHeartRateBpm, " bpm")} average heart rate
                </p>
              </>
            )}
            {syncLabel && <p aria-live="polite" className="dashboard-fit-last-sync">{syncLabel}</p>}
            {error && <p aria-live="polite" className="dashboard-fit-error">{error}</p>}
          </div>
          <div className="dashboard-fit-actions">
            {connectionStatus === "connected"
              ? <>
                  <button className="dashboard-primary-button" disabled={!canSync} onClick={fitness.sync} type="button">
                    {syncStatus === "syncing" ? "Syncing…" : syncStatus === "connecting" ? "Requesting…" : "Sync now"}
                  </button>
                  <button className="dashboard-secondary-button" disabled={!canDisconnect} onClick={fitness.disconnect} type="button">Disconnect</button>
                </>
              : <button className="dashboard-primary-button" disabled={!providerAvailable || fitness.loading || syncStatus === "connecting"} onClick={fitness.connect} type="button">
                  {syncStatus === "connecting" ? "Opening Google consent…" : providerAvailable ? "Connect & sync" : "Setup required"}
                </button>}
            {["failed", "denied", "empty"].includes(syncStatus) && providerAvailable && (
              <button className="dashboard-secondary-button" disabled={!canSync} onClick={fitness.sync} type="button">Try again</button>
            )}
          </div>
        </article>
        <div className="dashboard-stat-strip">
          <StatCard label="Imported distance" value={daily?.distanceMeters == null ? "--" : `${(daily.distanceMeters / 1000).toFixed(2)} km`} />
          <StatCard label="Average heart rate" value={displayMetric(daily?.averageHeartRateBpm, " bpm")} />
          <StatCard label="Provider workouts today" value={fitness.workouts.length.toLocaleString()} />
        </div>
      </section>
      <section className="dashboard-data-section">
        <div className="dashboard-section-heading"><div><p className="dashboard-eyebrow">Today&apos;s exercise</p><h2>Activity sessions</h2></div><button className="dashboard-secondary-button" onClick={onLogWorkout} type="button"><Plus size={16} /> Log activity</button></div>
        <p className="dashboard-section-subtitle">Imported sessions are read from Google Health; manually logged sessions are marked separately. Missing provider measurements remain unavailable.</p>
        {workouts.length ? (
          <div className="dashboard-workout-list">
            {[...workouts].reverse().map((workout) => (
              <article className="dashboard-workout-row" key={workout.id}>
                <span className="dashboard-info-icon"><Dumbbell size={18} /></span>
                <div><strong>{workout.label}</strong><p>{workout.minutes ?? "--"} min · {workout.steps ? `${workout.steps.toLocaleString()} steps · ` : ""}{workout.calories == null ? "--" : `${workout.calories} kcal`}{workout.averageHeartRateBpm == null ? "" : ` · avg ${workout.averageHeartRateBpm} bpm`}{workout.provider ? " · imported" : " · manual estimate"}</p></div>
                <time>{Number.isFinite(workout.time) ? new Date(workout.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--"}</time>
              </article>
            ))}
          </div>
        ) : <EmptyState text="No imported or manually logged workouts are available for today." action={onLogWorkout} actionLabel="Log a workout" />}
      </section>
    </>
  );
}

function ProgressPage({ currentWeight, onLogWeight, targetWeight, userData, weightEntries, activity }) {
  return (
    <>
      <PageHeader action={<button className="dashboard-primary-button" onClick={onLogWeight} type="button"><Weight size={17} /> Log Weight</button>} description="A snapshot of your progress and the profile targets you selected." eyebrow="Consistency over perfection" title="Progress" />
      <div className="dashboard-stat-strip">
        <StatCard label="Current weight" value={currentWeight ? `${currentWeight} kg` : "Not set"} />
        <StatCard label="Target weight" value={targetWeight ? `${targetWeight} kg` : "Not set"} />
        <StatCard label="Steps today" value={activity.stepsAvailable ? activity.steps.toLocaleString() : "--"} />
      </div>
      <section className="dashboard-data-section">
        <SectionHeading eyebrow="Starting profile" title="Your baseline" />
        <div className="dashboard-progress-grid">
          <article className="dashboard-info-card">
            <div className="dashboard-info-card-heading"><span className="dashboard-info-icon"><Weight size={18} /></span><div><h3>Weight journey</h3><p>{userData?.goal || userData?.lifestyleGoal || "Personal goal"}</p></div></div>
            <div className="dashboard-weight-comparison"><div><span>Starting/current</span><strong>{currentWeight || "--"} kg</strong></div><ChevronRight size={18} /><div><span>Target</span><strong>{targetWeight || "--"} kg</strong></div></div>
          </article>
          <article className="dashboard-info-card">
            <div className="dashboard-info-card-heading"><span className="dashboard-info-icon"><Flame size={18} /></span><div><h3>Activity today</h3><p>From workouts and connected data</p></div></div>
            <div className="dashboard-profile-facts"><span>{activity.stepsAvailable ? `${activity.steps.toLocaleString()} steps` : "-- steps"}</span><span>{activity.workoutMinutes} workout minutes</span><span>{activity.activeCaloriesKcal === null ? "-- active kcal" : `${activity.activeCaloriesKcal} active kcal`}</span></div>
          </article>
        </div>
      </section>
      <section className="dashboard-data-section">
        <SectionHeading eyebrow="Recent entries" title="Weight history" />
        {weightEntries.length ? (
          <div className="dashboard-workout-list">
            {[...weightEntries].reverse().map((entry) => (
              <article className="dashboard-workout-row" key={entry.time}>
                <span className="dashboard-info-icon"><Weight size={18} /></span>
                <div><strong>{entry.weight} kg</strong><p>Weight entry</p></div>
                <time>{new Date(entry.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
              </article>
            ))}
          </div>
        ) : <EmptyState text="No weight entries yet. Log your weight to start recording your progress." action={onLogWeight} actionLabel="Log weight" />}
      </section>
    </>
  );
}

function StatCard({ label, value }) {
  return <article className="dashboard-stat-card"><span>{label}</span><strong>{value}</strong></article>;
}

function EmptyState({ text, action, actionLabel }) {
  return <div className="dashboard-empty-meals"><p>{text}</p>{action && <button className="dashboard-secondary-button" onClick={action} type="button"><Plus size={15} /> {actionLabel}</button>}</div>;
}

function SectionHeading({ eyebrow, title }) {
  return <div className="dashboard-section-heading"><div><p className="dashboard-eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>;
}

function NutrientProgress({ label, current, target, color }) {
  const progress = target ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="dashboard-nutrient">
      <div className="dashboard-nutrient-label"><span>{label}</span><strong>{current}g / {target || "--"}g</strong></div>
      <div aria-label={`${label} ${current} of ${target || "no"} grams`} className="dashboard-nutrient-track" role="img">
        <span className={`dashboard-nutrient-fill ${color}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
