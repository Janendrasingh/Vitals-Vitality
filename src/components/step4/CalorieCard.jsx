import { Sparkles } from "lucide-react";
import { calculateNutrition } from "./nutritionCalculator";

export default function CalorieCard({ userData }) {

    const nutrition = calculateNutrition(userData);

    return (

        <div className="bg-gray-50 rounded-3xl p-8 shadow-sm">

            <div className="flex justify-between">

                <div>

                    <p className="uppercase text-xs tracking-widest text-gray-500 font-semibold">
                        Estimated Daily Calorie Target
                    </p>

                    <h1 className="text-6xl font-extrabold text-green-700 mt-2">
                        {nutrition.available ? nutrition.calories.toLocaleString() : "—"}
                    </h1>

                    <p className="text-gray-500">
                        {nutrition.available
                            ? `kcal / day · BMR ${nutrition.bmr.toLocaleString()} · TDEE ${nutrition.tdee.toLocaleString()} · estimate, not medical advice`
                            : nutrition.error}
                    </p>

                </div>

                <Sparkles
                    size={36}
                    className="text-orange-500"
                />

            </div>

        </div>

    );

}