import CalorieCard from "./CalorieCard";
import MacroCards from "./MacroCard";
import FatCard from "./FatCard";

export default function SummarySection({ userData }) {

    return (

        <div className="space-y-6">

            <CalorieCard userData={userData} />

            <MacroCards userData={userData} />

            <FatCard userData={userData} />

        </div>

    );
}