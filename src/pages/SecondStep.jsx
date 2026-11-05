import ProgressBar from "../components/common/ProgressBar";
import Button from "../components/common/Button";
import DietSection from "../components/step2/DietSections";
import AllergySection from "../components/step2/AllergySection";

import SecondStepImage from "../assets/SecondStepBG.png";
import Logo from "../assets/logo.png";

const foodPreferenceOptions = [
  { value: "rice", label: "Rice" },
  { value: "lentils", label: "Lentils" },
  { value: "paneer", label: "Paneer" },
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "nuts and seeds", label: "Nuts & seeds" },
  { value: "cereals and grains", label: "Grains" },
  { value: "pulses and legumes", label: "Pulses" },
  { value: "dairy products", label: "Dairy" },
];

export default function SecondStep({ step, nextStep, prevStep, formData, setFormData, onReturnDashboard }) {
  const foodPreferences = Array.isArray(formData.foodPreferences) ? formData.foodPreferences : [];

  function toggleFoodPreference(value) {
    const updated = foodPreferences.includes(value)
      ? foodPreferences.filter((preference) => preference !== value)
      : [...foodPreferences, value];
    setFormData((previous) => ({ ...previous, foodPreferences: updated }));
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-6">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* ================= LEFT PANEL ================= */}

        <div className="lg:w-2/5 relative overflow-hidden">
          {/* Background Image */}

          <img
            src={SecondStepImage}
            alt="Healthy Food"
            className="w-full h-full object-cover"
          />

          {/* Logo */}
{/* Logo */}

<div className="absolute top-10 left-10 flex items-center gap-4">

  <img
    src={Logo}
    alt="Vitals & Vitality"
    className="w-12 h-12 object-contain"
  />

  <h1 className="text-4xl font-bold italic text-white tracking-tight">
    Vitals & Vitality
  </h1>

</div>

          {/* Quote Card */}

          <div
            className="
      absolute
      bottom-10
      left-8
      right-8

      rounded-3xl
      p-8

      backdrop-blur-xl
      bg-white/20
      border border-white/20
      shadow-2xl
    "
          >
            <h2 className="text-3xl font-bold text-white leading-relaxed">
              "Eat food. Not too much. Mostly plants."
            </h2>

            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-12 rounded-full bg-lime-300 flex items-center justify-center text-black">
                🍃
              </div>

              <div>
                <p className="text-sm uppercase tracking-[2px] text-white/70 font-semibold">
                  MICHAEL POLLAN
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}

        <div className="flex-1 p-8 md:p-12 lg:p-16">
          {/* Header */}

          <p className="uppercase tracking-[4px] text-[#BB8C5C] text-sm font-semibold">
            Personalization
          </p>

          <div className="flex justify-between items-start mt-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Tailor Your Palette
            </h1>
          </div>

          {/* Progress */}

          <div className="mt-8">
            <ProgressBar step={step} />
          </div>

          {/* ================= DIET SECTION ================= */}

          <div className="mt-10">
            <DietSection
              selected={formData.diets}
              onChange={(diets) => setFormData((previous) => ({ ...previous, diets }))}
            />
          </div>

          <fieldset className="mt-10">
            <legend className="text-2xl font-bold text-gray-900">Foods you enjoy</legend>
            <p className="mt-2 text-sm text-gray-600">Optional preferences help narrow meal suggestions. Allergies are handled separately below.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {foodPreferenceOptions.map((option) => (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700" key={option.value}>
                  <input
                    checked={foodPreferences.includes(option.value)}
                    onChange={() => toggleFoodPreference(option.value)}
                    type="checkbox"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* ================= ALLERGY SECTION ================= */}

          <div className="mt-12">
            <AllergySection
              selected={formData.allergies}
              customAllergies={formData.customAllergies}
              onChange={(allergies, customAllergies) =>
                setFormData((previous) => ({ ...previous, allergies, customAllergies }))
              }
            />
          </div>

          {/* ================= BUTTONS ================= */}

          <div className="flex justify-between items-center mt-16">
            <div className="flex flex-wrap items-center gap-5">
              <button
                onClick={prevStep}
                className="text-gray-600 hover:text-green-600 font-medium transition"
                type="button"
              >
                ← Go Back
              </button>
              {onReturnDashboard && (
                <button
                  onClick={onReturnDashboard}
                  className="text-gray-600 hover:text-green-600 font-medium transition"
                  type="button"
                >
                  Back to Dashboard
                </button>
              )}
            </div>

            <Button onClick={nextStep} />
          </div>
        </div>
      </div>
    </div>
  );
}
