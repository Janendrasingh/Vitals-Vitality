import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function OnboardingApp() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    dietType: '',
    restrictions: [],
    allergies: [],
    cuisinePreferences: [],
    fitnessLevel: '',
    workoutFrequency: '',
    height: '',
    weight: '',
    goal: '',
  });

  const steps = [
    { title: 'User Profile', description: 'Basic information' },
    { title: 'Dietary Preferences', description: 'Food choices' },
    { title: 'Lifestyle & Metrics', description: 'Health data' },
    { title: 'Summary', description: 'Review & confirm' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    alert('Onboarding completed! Check console for data.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 transition-all ${
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <div className="text-center">
                  <p className={`text-sm font-semibold ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {currentStep === 0 && <Step1UserProfile formData={formData} handleInputChange={handleInputChange} />}
          {currentStep === 1 && <Step2DietaryPreferences formData={formData} handleCheckboxChange={handleCheckboxChange} handleInputChange={handleInputChange} />}
          {currentStep === 2 && <Step3LifestyleMetrics formData={formData} handleInputChange={handleInputChange} />}
          {currentStep === 3 && <Step4Summary formData={formData} />}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} /> Back
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="ml-auto flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="ml-auto flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                ✓ Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1: USER PROFILE
// ============================================================================
function Step1UserProfile({ formData, handleInputChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let's Get Started</h2>
      <p className="text-gray-600 mb-8">Tell us about yourself to personalize your experience.</p>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="John"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john.doe@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="25"
              min="18"
              max="120"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> This information helps us create personalized recommendations for your health and fitness journey.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2: DIETARY PREFERENCES
// ============================================================================
function Step2DietaryPreferences({ formData, handleCheckboxChange, handleInputChange }) {
  const dietTypes = [
    { id: 'omnivore', label: 'Omnivore', emoji: '🍽️' },
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
    { id: 'vegan', label: 'Vegan', emoji: '🌱' },
    { id: 'keto', label: 'Keto', emoji: '🥑' },
    { id: 'paleo', label: 'Paleo', emoji: '🥩' },
    { id: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
  ];

  const restrictions = [
    'Gluten-free',
    'Dairy-free',
    'Nut-free',
    'Soy-free',
    'Low-carb',
    'No refined sugar',
  ];

  const cuisines = [
    'Italian',
    'Asian',
    'Mexican',
    'Mediterranean',
    'Indian',
    'American',
    'Middle Eastern',
    'Thai',
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Dietary Preferences</h2>
      <p className="text-gray-600 mb-8">Help us understand your eating habits and preferences.</p>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">Primary Diet Type *</label>
          <div className="grid grid-cols-3 gap-3">
            {dietTypes.map(diet => (
              <button
                key={diet.id}
                onClick={() => handleInputChange({ target: { name: 'dietType', value: diet.id } })}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.dietType === diet.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{diet.emoji}</span>
                <span className="text-sm font-medium text-gray-900">{diet.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">Dietary Restrictions</label>
          <div className="grid grid-cols-2 gap-3">
            {restrictions.map(restriction => (
              <label
                key={restriction}
                className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.restrictions.includes(restriction)}
                  onChange={() => handleCheckboxChange('restrictions', restriction)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">{restriction}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">Favorite Cuisines</label>
          <div className="grid grid-cols-2 gap-3">
            {cuisines.map(cuisine => (
              <label
                key={cuisine}
                className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.cuisinePreferences.includes(cuisine)}
                  onChange={() => handleCheckboxChange('cuisinePreferences', cuisine)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">{cuisine}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Food Allergies (comma-separated)</label>
          <input
            type="text"
            name="allergies"
            value={Array.isArray(formData.allergies) ? formData.allergies.join(', ') : formData.allergies}
            onChange={(e) => {
              const allergies = e.target.value.split(',').map(a => a.trim()).filter(a => a);
              setFormData(prev => ({ ...prev, allergies }));
            }}
            placeholder="e.g., Peanuts, Shellfish, Dairy"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-2">⚠️ Important: Make sure to list all your allergies.</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            ✅ <strong>Good to know:</strong> We'll use this to personalize meal plans and restaurant recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3: LIFESTYLE & METRICS
// ============================================================================
function Step3LifestyleMetrics({ formData, handleInputChange }) {
  const fitnessLevels = [
    { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { id: 'lightly-active', label: 'Lightly Active', description: '1-3 days/week' },
    { id: 'moderately-active', label: 'Moderately Active', description: '3-5 days/week' },
    { id: 'very-active', label: 'Very Active', description: '6-7 days/week' },
  ];

  const workoutFrequencies = [
    { id: '0', label: 'Never', emoji: '😴' },
    { id: '1-2', label: '1-2x per week', emoji: '🚶' },
    { id: '3-4', label: '3-4x per week', emoji: '🏃' },
    { id: '5-6', label: '5-6x per week', emoji: '💪' },
    { id: '7', label: 'Daily', emoji: '⚡' },
  ];

  const goals = [
    { id: 'weight-loss', label: 'Weight Loss', emoji: '📉' },
    { id: 'muscle-gain', label: 'Build Muscle', emoji: '💪' },
    { id: 'general-health', label: 'General Health', emoji: '❤️' },
    { id: 'endurance', label: 'Build Endurance', emoji: '🏃' },
    { id: 'flexibility', label: 'Improve Flexibility', emoji: '🧘' },
    { id: 'maintain', label: 'Maintain Current', emoji: '⚖️' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Lifestyle & Metrics</h2>
      <p className="text-gray-600 mb-8">Share your health metrics and fitness goals.</p>

      <div className="space-y-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📏 Body Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm) *</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="170"
                min="100"
                max="250"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg) *</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="75"
                min="30"
                max="300"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          {formData.height && formData.weight && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>BMI:</strong> {(parseFloat(formData.weight) / ((parseFloat(formData.height) / 100) ** 2)).toFixed(1)}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">💪 Current Fitness Level *</label>
          <div className="space-y-2">
            {fitnessLevels.map(level => (
              <button
                key={level.id}
                onClick={() => handleInputChange({ target: { name: 'fitnessLevel', value: level.id } })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex justify-between items-center ${
                  formData.fitnessLevel === level.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">{level.label}</p>
                  <p className="text-xs text-gray-500">{level.description}</p>
                </div>
                {formData.fitnessLevel === level.id && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">🏋️ Workout Frequency *</label>
          <div className="grid grid-cols-5 gap-2">
            {workoutFrequencies.map(freq => (
              <button
                key={freq.id}
                onClick={() => handleInputChange({ target: { name: 'workoutFrequency', value: freq.id } })}
                className={`p-3 rounded-lg border-2 transition-all text-center flex flex-col items-center gap-1 ${
                  formData.workoutFrequency === freq.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{freq.emoji}</span>
                <span className="text-xs font-medium text-gray-700">{freq.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">🎯 Primary Goal *</label>
          <div className="grid grid-cols-3 gap-3">
            {goals.map(goal => (
              <button
                key={goal.id}
                onClick={() => handleInputChange({ target: { name: 'goal', value: goal.id } })}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.goal === goal.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{goal.emoji}</span>
                <span className="text-xs font-medium text-gray-900 text-center">{goal.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-900">
            📊 <strong>Your data is secure:</strong> We use your metrics to create personalized workout and meal plans.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 4: SUMMARY
// ============================================================================
function Step4Summary({ formData }) {
  const getSummaryValue = (value) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Not selected';
    }
    return value || 'Not provided';
  };

  const getBMI = () => {
    if (formData.height && formData.weight) {
      const bmi = parseFloat(formData.weight) / ((parseFloat(formData.height) / 100) ** 2);
      const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
      return { value: bmi.toFixed(1), category };
    }
    return null;
  };

  const bmi = getBMI();

  const SummarySection = ({ title, emoji, children }) => (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-b-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  const SummaryItem = ({ label, value }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{getSummaryValue(value)}</p>
    </div>
  );

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="inline-block mb-4">
          <div className="text-5xl">✨</div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">You're All Set!</h2>
        <p className="text-gray-600">Here's a summary of your profile. Review and confirm to complete your onboarding.</p>
      </div>

      <div className="space-y-2 mt-8">
        <SummarySection title="Personal Information" emoji="👤">
          <SummaryItem label="First Name" value={formData.firstName} />
          <SummaryItem label="Last Name" value={formData.lastName} />
          <SummaryItem label="Email" value={formData.email} />
          <SummaryItem label="Age" value={formData.age} />
          <SummaryItem label="Gender" value={formData.gender} />
        </SummarySection>

        <SummarySection title="Diet & Preferences" emoji="🍽️">
          <SummaryItem label="Diet Type" value={formData.dietType} />
          <SummaryItem label="Restrictions" value={formData.restrictions} />
          <SummaryItem label="Cuisines" value={formData.cuisinePreferences} />
          <SummaryItem label="Allergies" value={
            Array.isArray(formData.allergies) 
              ? formData.allergies.join(', ') || 'None'
              : formData.allergies || 'None'
          } />
        </SummarySection>

        <SummarySection title="Health Metrics" emoji="📊">
          <SummaryItem label="Height" value={`${formData.height} cm`} />
          <SummaryItem label="Weight" value={`${formData.weight} kg`} />
          {bmi && (
            <>
              <SummaryItem label="BMI" value={bmi.value} />
              <SummaryItem label="BMI Category" value={bmi.category} />
            </>
          )}
          <SummaryItem label="Fitness Level" value={formData.fitnessLevel} />
          <SummaryItem label="Workout Frequency" value={formData.workoutFrequency} />
          <SummaryItem label="Primary Goal" value={formData.goal} />
        </SummarySection>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Completion Checklist</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              <span className="text-sm text-gray-700">Personal profile completed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              <span className="text-sm text-gray-700">Dietary preferences configured</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              <span className="text-sm text-gray-700">Health metrics recorded</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              <span className="text-sm text-gray-700">Fitness goals set</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mt-6">
          <p className="text-sm text-amber-900">
            <strong>🚀 What's next?</strong> After completing this onboarding, you'll have access to personalized meal plans, workout routines, and progress tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
