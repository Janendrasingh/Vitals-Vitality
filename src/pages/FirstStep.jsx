import ProgressBar from "../components/ProgressBar";
import InputField from "../components/InputField";
import GenderSelector from "../components/GenderSelector";
import ActivityCard from "../components/ActivityCard";
import GoalCard from "../components/GoalCard";
import Button from "../components/Button";
import { useState } from "react";

import smoothie from "../assets/smoothie.jpg";

export default function FirstPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    weight: "",
    height: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-8">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
        {/* LEFT PANEL */}

        <div className="bg-linear-to-br from-green-50 to-white p-10">
          <h1 className="text-3xl font-bold text-green-700">
            Vitals & Vitality
          </h1>

          <img
            src={smoothie}
            alt=""
            className="w-100 h-100 mt-60 rounded-3xl shadow-lg rotate-6
      transition-all
      duration-500
      ease-out

      hover:rotate-0
      hover:-translate-y-3
      hover:scale-105

      shadow-lg,
      hover:shadow-[0_45px_90px_rgba(0,0,0,0.45)]
    "
          />

          <h2 className="mt-10 text-4xl font-bold">
            Your journey to a <br />
            <span className="text-green-600">balanced</span> life begins <br />
            here.
          </h2>

          <p className="mt-5 text-gray-500">
            Personalized nutrition and wellness <br />
            tracking designed for your unique biology.
          </p>
        </div>

        {/* RIGHT PANEL */}

        <div className="flex-1 p-6 md:p-10 lg:p-16 xl:p-20">
          <ProgressBar />

          <h1 className="mt-10 md:mt-16 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            {" "}
            Welcome to
            <br />
            Vitals & Vitality
          </h1>

          <p className="mt-4  text-gray-500">
            Let's create your personalized blueprint. Tell us a bit about <br />
            yourself to get started.
          </p>

          {/* INPUTS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <InputField
              label="Full Name"
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
            />

            <InputField
              label="Age"
              name="age"
              type="number"
              placeholder="28"
              value={formData.age}
              onChange={handleChange}
            />

            <InputField
              label="Weight (kg)"
              name="weight"
              type="number"
              placeholder="70"
              value={formData.weight}
              onChange={handleChange}
            />

            <InputField
              label="Height (cm)"
              name="height"
              type="number"
              placeholder="175"
              value={formData.height}
              onChange={handleChange}
            />
          </div>

          <GenderSelector />

          <div className="mt-8">
            <h3 className="font-semibold mb-4">Activity Level</h3>

            <div className="grid grid-cols-3 gap-4">
              <ActivityCard title="Sedentary" />

              <ActivityCard title="Moderate" active />

              <ActivityCard title="Very Active" />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold mb-4">Primary Goal</h3>

            <div className="grid grid-cols-3 gap-4">
              <GoalCard title="Weight Loss" />

              <GoalCard title="Muscle Gain" />

              <GoalCard title="Maintenance" />
            </div>
          </div>

          <div className="flex justify-between mt-12">
            <button className="text-gray-500">Skip for now</button>

            <Button />
          </div>
        </div>
      </div>
    </div>
  );
}
