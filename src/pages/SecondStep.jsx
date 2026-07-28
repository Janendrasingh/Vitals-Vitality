import ProgressBar from "../components/common/ProgressBar";
import Button from "../components/common/Button";
import DietSection from "../components/step2/DietSections";
import AllergySection from "../components/step2/AllergySection";

import SecondStepImage from "../assets/SecondStepBG.png";

export default function SecondStep({
  step,
  nextStep,
  prevStep,
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-6">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* ================= LEFT PANEL ================= */}

        <div className="lg:w-2/5">
          <img
            src={SecondStepImage}
            alt="Healthy Food"
            className="w-full h-full object-cover"
          />
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
  <DietSection />
</div>

{/* ================= ALLERGY SECTION ================= */}

<div className="mt-12">
  <AllergySection />
</div>

{/* ================= BUTTONS ================= */}

<div className="flex justify-between items-center mt-16">

            <button
              onClick={prevStep}
              className="text-gray-600 hover:text-green-600 font-medium transition"
            >
              ← Go Back
            </button>

            <Button onClick={nextStep} />

          </div>

        </div>

      </div>
    </div>
  );
}