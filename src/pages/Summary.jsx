import ProgressBar from "../components/common/ProgressBar";
import Logo from "../assets/logo.png";
import SummaryBG from "../assets/FourthStepBG.png";

import SummarySection from "../components/step4/SummarySection";

export default function Summary({ userData, prevStep }) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-6">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* ================= LEFT PANEL ================= */}

        <div className="lg:w-2/5 relative overflow-hidden">

          {/* Background Image */}

          <img
            src={SummaryBG}
            alt="Healthy Bowl"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark Overlay */}

          <div className="absolute inset-0 bg-black/15"></div>

          {/* Logo */}

          <div className="absolute top-10 left-10 flex items-center gap-3 z-10">

            <img
              src={Logo}
              alt="Logo"
              className="w-10 h-10 object-contain"
            />

            <h1 className="text-3xl font-bold italic text-white">
              Vitals & Vitality
            </h1>

          </div>

          {/* Glass Quote Card */}

          <div className="absolute bottom-8 left-8 right-8 z-10">

            <div className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">

              <h3 className="text-3xl italic font-bold text-green-300">
                "Health is the greatest wealth."
              </h3>

              <p className="mt-5 text-white/80 leading-7">
                Your daily choices are the ink in your journal.
                Let's make every page vibrant.
              </p>

            </div>

          </div>

        </div>

        {/* ================= RIGHT PANEL ================= */}

        <div className="flex-1 p-10 md:p-14 lg:p-16 overflow-y-auto">

          <ProgressBar step={4} />

          <h1 className="mt-10 text-6xl font-extrabold leading-tight">
            Your Journey
            <br />

            <span className="text-green-700 italic">
              Starts Now
            </span>

          </h1>

          <p className="mt-5 text-gray-500 text-lg leading-8 max-w-xl">
            We've crunched the numbers and curated your path.
            Here is your personalized nutritional blueprint for
            sustainable growth.
          </p>

          {/* Step 4 Cards */}

          <div className="mt-12">
            <SummarySection userData={userData} />
          </div>

          <div className="mt-10">
            <button
              type="button"
              onClick={prevStep}
              className="w-full rounded-full bg-linear-to-r from-[#038935] to-[#7FD37D] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-[1.02]"
            >
              Go to Dashboard →
            </button>
            <p className="mt-3 text-center text-sm text-gray-500">
              You can adjust these targets anytime in your profile settings.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
