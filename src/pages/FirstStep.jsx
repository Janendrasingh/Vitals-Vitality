import { useState } from "react";

import ProgressBar from "../components/common/ProgressBar";
import InputField from "../components/step1/InputField";
import GenderSelector from "../components/step1/GenderSelector";
import ActivityCard from "../components/step1/ActivityCard";
import GoalCard from "../components/step1/GoalCard";
import Button from "../components/common/Button";

import smoothie from "../assets/smoothie.jpg";

export default function FirstStep({ step, nextStep }) {  const goals = [
    {
      title: "Weight Loss",
      description: "Calorie deficit focus",
      icon: "📉",
    },
    {
      title: "Muscle Gain",
      description: "High protein synthesis",
      icon: "⚡",
    },
    {
      title: "Maintenance",
      description: "Sustainable health",
      icon: "⚖️",
    },
  ];

  const activities = [
    {
      title: "Sedentary",
      description: "Minimal movement, office-based work.",
      icon: "🪑",
    },
    {
      title: "Moderate",
      description: "Moving 3–5 times a week consistently.",
      icon: "🚶",
    },
    {
      title: "Very Active",
      description: "High intensity training almost daily.",
      icon: "🏋️",
    },
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    activity: "",
    goal: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-6">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* ================= LEFT PANEL ================= */}

        <div className="lg:w-2/5 bg-gradient-to-br from-green-50 to-white p-10 flex flex-col">
          <h1 className="text-4xl font-extrabold text-green-700">
            Vitals & Vitality
          </h1>

          <img
            src={smoothie}
            alt="Smoothie"
            className="w-80 md:w-96 mt-86 mx-auto rounded-3xl rotate-6 transition-all duration-500 hover:rotate-0 hover:-translate-y-3 hover:scale-105 hover:shadow-[0_40px_80px_rgba(0,0,0,0.35)]"
          />

          <h2 className="mt-10 text-4xl font-bold leading-tight">
            Your journey to a <br />
            <span className="text-green-600">balanced</span> life begins
            <br />
            here.
          </h2>

          <p className="mt-5 text-gray-500 text-lg">
            Personalized nutrition and wellness
            <br />
            tracking designed for your unique biology.
          </p>
        </div>

        {/* ================= RIGHT PANEL ================= */}

        <div className="flex-1 p-6 md:p-10 lg:p-16">
          <ProgressBar step={step} />

          <h1 className="mt-10 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Welcome to
            <br />
            Vitals & Vitality
          </h1>

          <p className="mt-5 text-gray-500">
            Let's create your personalized blueprint. Tell us a bit
            <br />
            about yourself to get started.
          </p>

          {/* ================= INPUTS ================= */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <InputField
              label="Full Name"
              name="fullName"
              type="text"
              placeholder=""
              value={formData.fullName}
              onChange={handleChange}
            />

            <InputField
              label="Age"
              name="age"
              type="number"
              placeholder="25"
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

          {/* ================= GENDER ================= */}

          <GenderSelector
            value={formData.gender}
            onChange={(gender) =>
              setFormData((prev) => ({
                ...prev,
                gender,
              }))
            }
          />

          {/* ================= ACTIVITY ================= */}

          <div className="mt-10">
            <h3 className="font-semibold text-lg mb-4">Activity Level</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.title}
                  title={activity.title}
                  description={activity.description}
                  icon={activity.icon}
                  active={formData.activity === activity.title}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      activity: activity.title,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          {/* ================= GOALS ================= */}

          <div className="mt-10">
            <h3 className="font-semibold text-lg mb-4">Primary Goal</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.title}
                  title={goal.title}
                  description={goal.description}
                  icon={goal.icon}
                  active={formData.goal === goal.title}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      goal: goal.title,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          {/* ================= BUTTONS ================= */}

          <div className="flex justify-between items-center mt-12">
            <button className="text-gray-500 hover:text-green-600 transition">
              Skip for now
            </button>

            <Button onClick={nextStep} />
          </div>
        </div>
      </div>
    </div>
  );
}
