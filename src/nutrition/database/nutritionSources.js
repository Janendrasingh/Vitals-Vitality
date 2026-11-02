export const nutritionSources = Object.freeze({
  icmrNinIfct2017: Object.freeze({
    id: "icmr-nin-ifct-2017",
    name: "ICMR-NIN Indian Food Composition Tables 2017",
    publisher: "Indian Council of Medical Research - National Institute of Nutrition",
    publicationYear: 2017,
    publicationReference: "Indian Food Composition Tables 2017",
    publicationUrl: null,
    status: "reference-only",
    note: "No individual IFCT food record has been imported or verified in this dataset.",
  }),
  usdaFoodDataCentral: Object.freeze({
    id: "usda-food-data-central",
    name: "USDA FoodData Central",
    publisher: "United States Department of Agriculture",
    documentationUrl: "https://fdc.nal.usda.gov/data-documentation/",
    status: "reference-only",
    note: "Documentation was consulted, but no individual FDC food record has been imported or verified in this dataset.",
  }),
});

export default nutritionSources;
