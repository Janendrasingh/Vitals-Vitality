import { useState } from "react";
import AllergyChip from "./AllergyChip";

export default function AllergySection() {
  const defaultAllergies = [
    { id: 1, name: "Dairy", icon: "🥛" },
    { id: 2, name: "Peanuts", icon: "🥜" },
    { id: 3, name: "Shellfish", icon: "🦪" },
    { id: 4, name: "Soy", icon: "🌱" },
    { id: 5, name: "Honey", icon: "🍯" },
  ];

  const [selected, setSelected] = useState([]);

  const [showInput, setShowInput] = useState(false);

  const [customValue, setCustomValue] = useState("");

  const [customAllergies, setCustomAllergies] = useState([]);

  const toggleSelection = (name) => {
    if (selected.includes(name)) {
      setSelected(selected.filter((item) => item !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  const addCustomAllergy = () => {
    const value = customValue.trim();

    if (!value) return;

    if (!customAllergies.includes(value)) {
      setCustomAllergies([...customAllergies, value]);
      setSelected([...selected, value]);
    }

    setCustomValue("");
    setShowInput(false);
  };

  const removeCustom = (name) => {
    setCustomAllergies(
      customAllergies.filter((item) => item !== name)
    );

    setSelected(
      selected.filter((item) => item !== name)
    );
  };

  const clearAll = () => {
    setSelected([]);
    setCustomAllergies([]);
  };

  return (
    <div className="mt-10">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold">
          Allergies & Intolerances
        </h2>

        <button
          onClick={clearAll}
          className="text-green-700 font-semibold hover:underline"
        >
          Clear All
        </button>

      </div>

      {/* Default Chips */}

      <div className="flex flex-wrap gap-4">

        {defaultAllergies.map((item) => (
          <AllergyChip
            key={item.id}
            label={item.name}
            icon={item.icon}
            active={selected.includes(item.name)}
            onClick={() => toggleSelection(item.name)}
          />
        ))}

        {/* Other */}

        <button
          onClick={() => setShowInput(!showInput)}
          className="px-5 py-3 rounded-full border border-gray-300 bg-white hover:border-green-600 hover:bg-green-50 transition"
        >
          + Other
        </button>

      </div>

      {/* Input */}

      {showInput && (

        <div className="mt-6 flex gap-3 flex-wrap">

          <input
            type="text"
            value={customValue}
            placeholder="Enter allergy..."
            onChange={(e) =>
              setCustomValue(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addCustomAllergy();
              }
            }}
            className="flex-1 min-w-[220px] border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            onClick={addCustomAllergy}
            className="px-6 py-3 rounded-xl bg-green-700 text-white hover:bg-green-800 transition"
          >
            Add
          </button>

        </div>

      )}

      {/* Custom Chips */}

      {customAllergies.length > 0 && (

        <div className="mt-6">

          <p className="text-sm text-gray-500 mb-3">
            Custom Allergies
          </p>

          <div className="flex flex-wrap gap-3">

            {customAllergies.map((item) => (

              <button
                key={item}
                onClick={() => removeCustom(item)}
                className="bg-orange-500 text-white rounded-full px-5 py-2 hover:bg-red-500 transition"
              >
                {item} ✕
              </button>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}