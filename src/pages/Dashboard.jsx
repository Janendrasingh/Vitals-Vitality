import { useMemo, useState } from "react";
import {
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
  Plus,
  Settings,
  Utensils,
  Weight,
  X,
} from "lucide-react";
import { calculateNutrition } from "../components/step4/nutritionCalculator";
import "./Dashboard.css";

const initialMeals = [
  {
    id: 1,
    category: "Breakfast",
    name: "Avocado Toast & Egg",
    details: "Sourdough, half avocado, 2 eggs",
    calories: 420,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 2,
    category: "Lunch",
    name: "Salmon Quinoa Bowl",
    details: "Atlantic salmon, quinoa, roasted greens",
    calories: 420,
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=85",
  },
];

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Meal Planner", icon: CalendarDays },
  { label: "Recipes", icon: Utensils },
  { label: "Workouts", icon: Dumbbell },
  { label: "Progress", icon: Flame },
];

function DashboardModal({ mode, onClose, onSubmit }) {
  const isMeal = mode === "meal";
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [weight, setWeight] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(isMeal ? { name, calories: Number(calories) } : { weight: Number(weight) });
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
              {isMeal ? "Meal tracker" : "Progress tracker"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900" id="dashboard-modal-title">
              {isMeal ? "Log a meal" : "Log your weight"}
            </h2>
          </div>
          <button aria-label="Close dialog" className="dashboard-icon-button" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isMeal ? (
            <>
              <label className="dashboard-field">
                Meal name
                <input autoFocus onChange={(event) => setName(event.target.value)} required value={name} />
              </label>
              <label className="dashboard-field">
                Calories
                <input
                  min="1"
                  onChange={(event) => setCalories(event.target.value)}
                  required
                  type="number"
                  value={calories}
                />
              </label>
            </>
          ) : (
            <label className="dashboard-field">
              Weight (kg)
              <input
                autoFocus
                min="1"
                onChange={(event) => setWeight(event.target.value)}
                required
                step="0.1"
                type="number"
                value={weight}
              />
            </label>
          )}
          <button className="dashboard-primary-button w-full justify-center" type="submit">
            <Check size={18} />
            Save {isMeal ? "meal" : "weight"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function Dashboard({ userData }) {
  const nutrition = useMemo(() => calculateNutrition(userData), [userData]);
  const calorieGoal = nutrition.calories || 2400;
  const proteinGoal = nutrition.protein || 140;
  const carbsGoal = nutrition.carbs || 300;
  const fatGoal = nutrition.fat || 65;
  const [meals, setMeals] = useState(initialMeals);
  const [waterGlasses, setWaterGlasses] = useState(6);
  const [modal, setModal] = useState(null);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [weightMessage, setWeightMessage] = useState("");
  const consumed = meals.reduce((total, meal) => total + meal.calories, 0);
  const caloriesLeft = Math.max(calorieGoal - consumed, 0);
  const calorieProgress = Math.min((consumed / calorieGoal) * 100, 100);
  const displayName = userData?.fullName?.trim().split(/\s+/)[0] || "there";
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  function saveEntry(entry) {
    if (modal === "meal") {
      setMeals((previous) => [
        ...previous,
        {
          ...entry,
          id: Date.now(),
          category: "Snack",
          details: "Added to your meal log",
          image: "",
        },
      ]);
    } else {
      setWeightMessage(`Weight logged: ${entry.weight} kg`);
    }
    setModal(null);
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <a aria-label="Vitals and Vitality home" className="dashboard-brand" href="#dashboard">
          Vitals &amp; Vitality
        </a>
        <nav aria-label="Main navigation" className="dashboard-topnav">
          {navigation.map(({ label }) => (
            <button
              aria-current={activeNav === label ? "page" : undefined}
              className={activeNav === label ? "dashboard-topnav-link is-active" : "dashboard-topnav-link"}
              key={label}
              onClick={() => setActiveNav(label)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="dashboard-top-actions">
          <button className="dashboard-primary-button desktop-log-meal" onClick={() => setModal("meal")} type="button">
            <Plus size={17} />
            Log Meal
          </button>
          <button aria-label="Notifications" className="dashboard-icon-button" type="button">
            <Bell size={19} />
          </button>
          <button aria-label="Settings" className="dashboard-icon-button" type="button">
            <Settings size={19} />
          </button>
          <div aria-label={`${displayName}'s profile`} className="dashboard-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <aside className="dashboard-sidebar">
        <div className="dashboard-profile">
          <strong>{displayName}</strong>
          <span>Goal: {calorieGoal.toLocaleString()} kcal</span>
        </div>
        <nav aria-label="Dashboard sections" className="dashboard-side-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              aria-current={activeNav === label ? "page" : undefined}
              className={activeNav === label ? "dashboard-side-link is-active" : "dashboard-side-link"}
              key={label}
              onClick={() => setActiveNav(label)}
              type="button"
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
          <div className="dashboard-side-divider" />
          <button className="dashboard-side-link" onClick={() => setWaterGlasses((count) => Math.min(count + 1, 10))} type="button">
            <Droplet size={18} />
            Log Water
          </button>
          <button className="dashboard-side-link" onClick={() => setActiveNav("Settings")} type="button">
            <Settings size={18} />
            Settings
          </button>
        </nav>
        <div className="dashboard-sidebar-tip">
          <Leaf size={18} />
          <p>Small steps add up. Keep showing up for yourself.</p>
        </div>
      </aside>

      <main className="dashboard-main" id="dashboard">
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">{today}</p>
            <h1>Good morning, {displayName}.</h1>
            <p>
              You&apos;ve reached <strong>{Math.round(calorieProgress)}%</strong> of your daily target. Keep it up!
            </p>
          </div>
          <div className="dashboard-welcome-actions">
            <button className="dashboard-secondary-button" onClick={() => setModal("weight")} type="button">
              <Weight size={17} />
              Log Weight
            </button>
            <button className="dashboard-primary-button" onClick={() => setModal("meal")} type="button">
              <CirclePlus size={18} />
              Log Meal
            </button>
          </div>
        </section>

        <section aria-label="Daily nutrition and hydration" className="dashboard-overview-grid">
          <article className="dashboard-nutrition-card">
            <div
              aria-label={`${caloriesLeft.toLocaleString()} calories left of ${calorieGoal.toLocaleString()}`}
              className="dashboard-calorie-ring"
              role="img"
              style={{ "--progress": `${calorieProgress}%` }}
            >
              <div className="dashboard-calorie-ring-inner">
                <strong>{caloriesLeft.toLocaleString()}</strong>
                <span>KCAL LEFT</span>
              </div>
            </div>
            <div className="dashboard-nutrients">
              <h2>Nutrient<br />Breakdown</h2>
              <NutrientProgress label="Protein" current={Math.round(proteinGoal * 0.61)} target={proteinGoal} color="green" />
              <NutrientProgress label="Carbs" current={Math.round(carbsGoal * 0.64)} target={carbsGoal} color="orange" />
              <NutrientProgress label="Fat" current={Math.round(fatGoal * 0.65)} target={fatGoal} color="olive" />
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
            <button
              className="dashboard-water-button"
              disabled={waterGlasses >= 10}
              onClick={() => setWaterGlasses((count) => Math.min(count + 1, 10))}
              type="button"
            >
              {waterGlasses >= 10 ? "Daily water goal reached" : "Add 250ml Glass"}
            </button>
          </article>
        </section>

        <section aria-labelledby="meal-log-title" className="dashboard-meal-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">Fuel your day</p>
              <h2 id="meal-log-title">Today&apos;s Meal Log</h2>
            </div>
            <button className="dashboard-history-link" onClick={() => setActiveNav("Meal Planner")} type="button">
              View All History <ChevronRight size={16} />
            </button>
          </div>
          <div className="dashboard-meal-grid">
            {meals.map((meal) => (
              <article className="dashboard-meal-card" key={meal.id}>
                <div
                  aria-label={meal.name}
                  className={meal.image ? "dashboard-meal-image" : "dashboard-meal-image dashboard-meal-image-empty"}
                  role="img"
                  style={meal.image ? { backgroundImage: `url("${meal.image}")` } : undefined}
                >
                  <span>{meal.category}</span>
                </div>
                <div className="dashboard-meal-details">
                  <div>
                    <h3>{meal.name}</h3>
                    <p>{meal.details}</p>
                  </div>
                  <strong>{meal.calories}<span>kcal</span></strong>
                </div>
              </article>
            ))}
            <button className="dashboard-add-meal-card" onClick={() => setModal("meal")} type="button">
              <span className="dashboard-add-meal-icon"><Utensils size={20} /></span>
              <strong>Log Next Meal</strong>
              <span>Add dinner or a snack</span>
              <span className="dashboard-add-meal-action"><Plus size={15} /> Add meal</span>
            </button>
          </div>
          {weightMessage && <p aria-live="polite" className="dashboard-feedback">{weightMessage}</p>}
        </section>
      </main>
      {modal && <DashboardModal mode={modal} onClose={() => setModal(null)} onSubmit={saveEntry} />}
    </div>
  );
}

function NutrientProgress({ label, current, target, color }) {
  const progress = Math.min((current / target) * 100, 100);
  return (
    <div className="dashboard-nutrient">
      <div className="dashboard-nutrient-label">
        <span>{label}</span>
        <strong>{current}g / {target}g</strong>
      </div>
      <div aria-label={`${label} ${current} of ${target} grams`} className="dashboard-nutrient-track" role="img">
        <span className={`dashboard-nutrient-fill ${color}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
