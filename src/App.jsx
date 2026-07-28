import { useState } from "react";

import FirstStep from "./pages/FirstStep";
import SecondStep from "./pages/SecondStep";
//import ThirdStep from "./pages/ThirdStep";
//import Summary from "./pages/Summary";

export default function App() {
  const [step, setStep] = useState(1);

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
        />
      );

    case 2:
      return (
        <SecondStep
          step={step}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      );

    case 3:
      return (
        <ThirdStep
          step={step}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      );

    case 4:
      return (
        <Summary
          step={step}
          prevStep={prevStep}
        />
      );

    default:
      return <FirstStep step={1} nextStep={nextStep} />;
  }
}