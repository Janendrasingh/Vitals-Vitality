import { useState } from "react";
import DietCard from "./DietCard";

export default function DietSection() {
  const diets = [
    {
      title: "Vegan",
      description:
        "No animal products, focused on plant-based vitality.",
      icon: "🌿",
    },
    {
      title: "Keto",
      description:
        "High fat, low carb to fuel your body with ketones.",
      icon: "⚡",
    },
    {
      title: "Paleo",
      description:
        "Whole foods focused on what our ancestors ate.",
      icon: "🌲",
    },
    {
      title: "Gluten-Free",
      description:
        "Complete avoidance of gluten-containing grains.",
      icon: "🍇",
    },
  ];

  const [selected, setSelected] = useState(["Keto"]);

  const toggleDiet = (diet) => {
    if (selected.includes(diet)) {
      setSelected(selected.filter((item) => item !== diet));
    } else {
      setSelected([...selected, diet]);
    }
  };

  return (
    <div className="mt-10">
      {/* Heading */}

      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-3xl font-bold">
          Dietary Preferences
        </h2>

        <span className="bg-orange-100 text-orange-500 text-xs font-semibold px-3 py-1 rounded-full">
          MULTI-SELECT
        </span>
      </div>

      {/* Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {diets.map((diet) => (
          <DietCard
            key={diet.title}
            {...diet}
            selected={selected.includes(diet.title)}
            onClick={() => toggleDiet(diet.title)}
          />
        ))}
      </div>
    </div>
  );
}