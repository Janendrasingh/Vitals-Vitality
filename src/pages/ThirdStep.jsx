import ProgressBar from "../components/common/ProgressBar";
import Button from "../components/common/Button";
import LifestyleSection from "../components/step3/LifestyleSection";

import Logo from "../assets/logo.png";
import ThirdStepImage from "../assets/ThirdStepBG.png";

export default function ThirdStep({
  step,
  nextStep,
  prevStep,
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-6">

      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* ================= LEFT PANEL ================= */}

        <div className="lg:w-2/5 relative overflow-hidden">

          <img
            src={ThirdStepImage}
            alt="Lifestyle"
            className="w-full h-full object-cover"
          />

          {/* Logo */}

          <div className="absolute top-10 left-10 flex items-center gap-3">

            <img
              src={Logo}
              alt="Logo"
              className="w-10 h-10"
            />

            <h1 className="text-3xl italic font-bold text-white">
              Vitals & Vitality
            </h1>

          </div>

          {/* Glass Card */}

          <div
            className="
            absolute
            bottom-8
            left-8
            right-8
            rounded-3xl
            p-8
            bg-white/20
            backdrop-blur-xl
            border
            border-white/20
            shadow-2xl
            "
          >

            <p className="text-white text-xl italic font-semibold">
              Living Journal
            </p>

            <h2 className="mt-4 text-5xl font-extrabold leading-tight text-white">

              Focus on the
              <br />
              path, not just
              <br />
              the finish.

            </h2>

            <p className="mt-6 text-lg leading-8 text-white/80">

              Your activity level and goals
              help us craft a journal that
              grows with you.

            </p>

          </div>

        </div>

        {/* ================= RIGHT PANEL ================= */}

        <div className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto">

          {/* Header */}

          <p className="uppercase tracking-[4px] text-[#BB8C5C] text-sm font-semibold">

            Lifestyle

          </p>

          <h1 className="mt-3 text-5xl font-bold text-gray-900">

            Lifestyle & Metrics

          </h1>

          <p className="mt-5 text-gray-500 leading-8 max-w-2xl">

            Define your pace. Whether you're sprinting toward a goal
            or finding balance, we'll track the rhythm of your
            progress.

          </p>

          {/* Progress */}

          <div className="mt-8">

            <ProgressBar step={step} />

          </div>

          {/* Lifestyle Components */}

          <div className="mt-12">

            <LifestyleSection />

          </div>

          {/* Buttons */}

          <div className="flex justify-between items-center mt-16">

            <button
              onClick={prevStep}
              className="text-gray-600 hover:text-green-600 transition font-medium"
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