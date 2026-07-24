import ProgressBar from "../components/ProgressBar";
import InputField from "../components/InputField";
import GenderSelector from "../components/GenderSelector";
import ActivityCard from "../components/ActivityCard";
import GoalCard from "../components/GoalCard";
import Button from "../components/Button";

import smoothie from "../assets/smoothie.jpg";

export default function FirstPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-8">

      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-2">

        {/* LEFT PANEL */}

        <div className="bg-linear-to-br from-green-50 to-white p-10">

          <h1 className="text-3xl font-bold text-green-700">
            Vitals & Vitality
          </h1>

          <img
            src={smoothie}
            alt=""
            className="mt-12 rounded-3xl shadow-lg"
          />

          <h2 className="mt-10 text-4xl font-bold">

            Your journey to a

            <span className="text-green-600">

              balanced life

            </span>

            begins here.
          </h2>

          <p className="mt-5 text-gray-500">

            Personalized nutrition and wellness tracking
            designed for your unique biology.

          </p>

        </div>

        {/* RIGHT PANEL */}

        <div className="p-16">

          <ProgressBar />

          <h1 className="mt-10 text-5xl font-bold">

            Welcome to
            <br />
            Vitals & Vitality

          </h1>

          <p className="mt-4 text-gray-500">

            Let's create your personalized blueprint.

          </p>

          {/* INPUTS */}

          <div className="grid grid-cols-2 gap-6 mt-10">

            <InputField label="Full Name" />
            <InputField label="Age" />

            <InputField label="Weight" />
            <InputField label="Height" />

          </div>

          <GenderSelector />

          <div className="mt-8">

            <h3 className="font-semibold mb-4">

              Activity Level

            </h3>

            <div className="grid grid-cols-3 gap-4">

              <ActivityCard title="Sedentary" />

              <ActivityCard
                title="Moderate"
                active
              />

              <ActivityCard title="Very Active" />

            </div>

          </div>

          <div className="mt-8">

            <h3 className="font-semibold mb-4">

              Primary Goal

            </h3>

            <div className="grid grid-cols-3 gap-4">

              <GoalCard title="Weight Loss" />

              <GoalCard title="Muscle Gain" />

              <GoalCard title="Maintenance" />

            </div>

          </div>

          <div className="flex justify-between mt-12">

            <button className="text-gray-500">

              Skip for now

            </button>

            <Button />

          </div>

        </div>

      </div>

    </div>
  );
}