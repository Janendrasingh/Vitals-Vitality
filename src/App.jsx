import { useEffect, useState } from "react";

import FirstStep from "./pages/FirstStep";
import SecondStep from "./pages/SecondStep";
import ThirdStep from "./pages/ThirdStep";
import Summary from "./pages/Summary";

export default function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const savedProfile = localStorage.getItem("vitalsProfile");

    return savedProfile
      ? JSON.parse(savedProfile)
      : {
          fullName: "", age: "", weight: "", height: "", gender: "", activity: "", goal: "",
          diets: [], allergies: [], customAllergies: [], targetWeight: "", lifestyleGoal: "Maintain",
          activityScore: 50, typicalDay: "",
        };
  });

  useEffect(() => {
    localStorage.setItem("vitalsProfile", JSON.stringify(formData));
  }, [formData]);

  const nextStep = () => {
    if (step < 4) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  switch (step) {
    case 1:
      return (
        <FirstStep
          step={step}
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case 2:
      return (
        <SecondStep
          step={step}
          nextStep={nextStep}
          prevStep={prevStep}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case 3:
      return (
        <ThirdStep
          step={step}
          nextStep={nextStep}
          prevStep={prevStep}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case 4:
      return (
        <Summary
          step={step}
          prevStep={prevStep}
          userData={formData}
        />
      );

    default:
      return <FirstStep step={1} nextStep={nextStep} />;
  }
}
