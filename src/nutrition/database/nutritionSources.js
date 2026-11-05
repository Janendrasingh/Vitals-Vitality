export const nutritionSources = Object.freeze({
  icmrNinIfct2017: Object.freeze({
    id: "icmr-nin-ifct-2017",
    name: "ICMR-NIN Indian Food Composition Tables 2017",
    publisher: "Indian Council of Medical Research - National Institute of Nutrition",
    publicationYear: 2017,
    publicationReference: "Indian Food Composition Tables 2017",
    publicationUrl: null,
    status: "reference-only",
    note: "The current ingredient values are not transcribed from IFCT; an individual IFCT record must be reviewed before replacing equivalent international records.",
  }),
  usdaSrLegacy2018: Object.freeze({
    id: "usda-food-data-central-sr-legacy-2018",
    name: "USDA FoodData Central SR Legacy",
    publisher: "United States Department of Agriculture",
    publicationYear: 2018,
    publicationReference: "FoodData Central SR Legacy CSV release, April 2018",
    publicationUrl: "https://fdc.nal.usda.gov/download-datasets.html",
    status: "selected-records-imported",
    note: "Imported records identify the exact FDC food ID. They represent generic food matches and are not India-specific cultivar, recipe, or brand measurements.",
  }),
  usdaFndds2024: Object.freeze({
    id: "usda-food-data-central-fndds-2024",
    name: "USDA FoodData Central Survey (FNDDS)",
    publisher: "United States Department of Agriculture",
    publicationYear: 2024,
    publicationReference: "FoodData Central Survey CSV release, October 31, 2024",
    publicationUrl: "https://fdc.nal.usda.gov/download-datasets.html",
    status: "selected-records-imported",
    note: "The paneer entry cites its exact FNDDS food ID. Survey records are not a substitute for India-specific product measurements.",
  }),
});

export default nutritionSources;
