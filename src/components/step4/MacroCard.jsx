import { Beef, Wheat } from "lucide-react";
import { calculateNutrition } from "./nutritionCalculator";

export default function MacroCards({ userData }) {

    const nutrition = calculateNutrition(userData);

    return (

        <div className="grid grid-cols-2 gap-5">

            <div className="bg-gray-50 rounded-3xl p-7">

                <div className="flex justify-between">

                    <Beef className="text-green-700"/>

                    <span className="font-bold text-green-700">
                        {nutrition.protein} g
                    </span>

                </div>

                <h2 className="mt-8 text-3xl font-bold">
                    Protein
                </h2>

                <p className="text-gray-500">
                    30% TARGET
                </p>

            </div>

            <div className="bg-gray-50 rounded-3xl p-7">

                <div className="flex justify-between">

                    <Wheat className="text-orange-500"/>

                    <span className="font-bold text-orange-500">
                        {nutrition.carbs} g
                    </span>

                </div>

                <h2 className="mt-8 text-3xl font-bold">
                    Carbs
                </h2>

                <p className="text-gray-500">
                    40% TARGET
                </p>

            </div>

        </div>

    );

}