const draftRecipes = [
  {
    id: "poha-draft",
    name: "Poha",
    mealCategory: "breakfast",
    ingredients: [
      { ingredientId: "flattened-rice", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "onion", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "peanut", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
  {
    id: "besan-chilla-draft",
    name: "Besan Chilla",
    mealCategory: "breakfast",
    ingredients: [
      { ingredientId: "chickpea-flour", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "onion", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "oil", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
  {
    id: "dal-rice-draft",
    name: "Dal Rice",
    mealCategory: "lunch",
    ingredients: [
      { ingredientId: "lentils", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "rice", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "oil", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
  {
    id: "rajma-rice-draft",
    name: "Rajma Rice",
    mealCategory: "lunch",
    ingredients: [
      { ingredientId: "kidney-beans", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "rice", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "tomato", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
  {
    id: "vegetable-khichdi-draft",
    name: "Vegetable Khichdi",
    mealCategory: "dinner",
    ingredients: [
      { ingredientId: "rice", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "lentils", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "mixed-vegetables", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
  {
    id: "idli-draft",
    name: "Idli",
    mealCategory: "breakfast",
    ingredients: [
      { ingredientId: "rice", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "urad-dal", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
  {
    id: "vegetable-upma-draft",
    name: "Vegetable Upma",
    mealCategory: "breakfast",
    ingredients: [
      { ingredientId: "semolina", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "mixed-vegetables", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "oil", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
  {
    id: "paneer-meal-draft",
    name: "Paneer Vegetable Bowl",
    mealCategory: "dinner",
    ingredients: [
      { ingredientId: "paneer", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "mixed-vegetables", quantityGrams: null, preparationState: null, quantityBasis: null },
      { ingredientId: "oil", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
  {
    id: "roasted-chana-draft",
    name: "Roasted Chana",
    mealCategory: "evening-snacks",
    ingredients: [
      { ingredientId: "chickpeas", quantityGrams: null, preparationState: null, quantityBasis: null },
    ],
  },
];

export const recipes = Object.freeze(draftRecipes.map((recipe) => Object.freeze({
  ...recipe,
  servings: null,
  servingDescription: "Serving size not yet established from a cited recipe.",
  cookingMethod: null,
  preparationAssumptions: Object.freeze([
    "Ingredient quantities, preparation states, and cooking yield require source verification.",
    "No oil absorption or nutrient retention assumptions have been established.",
  ]),
  dietaryTags: Object.freeze([]),
  allergens: null,
  verificationStatus: "unverified",
  provenance: Object.freeze({
    sourceName: null,
    sourceReference: null,
    sourceUrl: null,
    status: "not-sourced",
  }),
})));

export default recipes;
