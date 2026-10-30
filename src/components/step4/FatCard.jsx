import { Droplet } from "lucide-react";
import { calculateNutrition } from "./nutritionCalculator";

export default function FatCard({ userData }) {

    const nutrition = calculateNutrition(userData);

    return (

        <div className="bg-gray-50 rounded-3xl p-7">

            <div className="flex justify-between items-center">

                <div className="flex gap-4 items-center">

                    <Droplet className="text-lime-700"/>

                    <div>

                        <h2 className="font-bold text-2xl">
                            Healthy Fats
                        </h2>

                        <p className="text-gray-500">
                            {nutrition.available ? `${nutrition.fat} g/day estimated` : nutrition.error}
                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

}