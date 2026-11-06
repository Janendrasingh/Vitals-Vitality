# INDB source evaluation

## Executive decision

The official Anuvaad INDB workbook is a useful **recipe-nutrition reference**, but the linked `Anuvaad_INDB_2024.11.xlsx` is not a raw ingredient nutrient workbook. Its single sheet contains 1,014 composite recipe rows. It contains no individually addressable raw-food records for the requested 10 ingredients, so it cannot safely close the project's ingredient-nutrition gaps.

The workbook is publicly downloadable from the official portal, which calls the resource open access. However, the portal does not state an explicit licence for the downloadable workbook. The linked paper is CC BY 4.0, but that licence notice applies to the paper and does not by itself establish the rights to the separate spreadsheet or its source data. The linked GitHub repository has no declared repository licence; its README says the IFCT 2017 and 2004 inputs must be requested from NIN. Commercial reuse, redistribution, and creation/redistribution of a derivative workbook therefore remain **unconfirmed**.

**Recommendation:** do not import, redistribute, or commit INDB workbook records or derived ingredient data until Anuvaad maintainers confirm the workbook's licence and the rights for the constituent sources in writing.

## Official download and inspection

- Portal: <https://www.anuvaad.org.in/indian-nutrient-databank/>
- Portal's “Download Data” link: <https://www.anuvaad.org.in/wp-content/uploads/2020/07/Anuvaad_INDB_2024.11.xlsx>
- Download: succeeded; XLSX/ZIP signature verified.
- Download size: 1,063,574 bytes.
- SHA-256: `c39023890f45b86b7f68578a4f740c5772234402111054c28a7a867d8dda25d9`
- Inspection: Python 3.12.10 with `openpyxl` 3.1.5 in an isolated temporary target; workbook opened read-only and values-only.
- Workbook retained for inspection in the separate temporary research directory `%TEMP%\Anuvaad_INDB_research_phase510\Anuvaad_INDB_2024.11.xlsx`; it is not included in this repository or production data.

## Dataset scope and counts

The workbook contains one sheet (`Sheet1`), with 1,015 rows including the header and 82 columns. It has 1,014 data rows, each with a food code, recipe name, and primary source. The records are recipes, not raw food ingredients:

| Source field | Rows |
|---|---:|
| `asc_manual` | 490 |
| `bfp_manual` | 376 |
| `open_source_recipes` | 148 |
| **Total** | **1,014** |

Searching recipe names for the 10 target ingredient identities found **37 unique recipe-title rows** that mention related names/forms. These are review leads only; because every workbook row is a composite recipe record, none counts as a raw-ingredient match. Across the 10 requested identities, there are **0 exact ingredient matches**, **0 possible ingredient-record matches**, and **10 with no suitable raw ingredient record**.

The paper reports a wider INDB work product containing 1,095 raw food items and 1,014 recipes. The downloadable portal workbook inspected here contains only the 1,014 recipe records; it does not contain the separate raw-ingredient nutrient tables. The article-linked GitHub README says the IFCT 2017 and IFCT 2004 data files must be requested from their original source.

### Workbook columns and nutrient coverage

The 82 columns comprise three recipe identifiers (`food_code`, `food_name`, `primarysource`), 39 per-100-g nutrient fields, one `servings_unit` field, and 39 per-serving nutrient fields.

The per-100-g nutrient columns are:

`energy_kj`, `energy_kcal`, `carb_g`, `protein_g`, `fat_g`, `freesugar_g`, `fibre_g`, `sfa_mg`, `mufa_mg`, `pufa_mg`, `cholesterol_mg`, `calcium_mg`, `phosphorus_mg`, `magnesium_mg`, `sodium_mg`, `potassium_mg`, `iron_mg`, `copper_mg`, `selenium_ug`, `chromium_mg`, `manganese_mg`, `molybdenum_mg`, `zinc_mg`, `vita_ug`, `vite_mg`, `vitd2_ug`, `vitd3_ug`, `vitk1_ug`, `vitk2_ug`, `folate_ug`, `vitb1_mg`, `vitb2_mg`, `vitb3_mg`, `vitb5_mg`, `vitb6_mg`, `vitb7_ug`, `vitb9_ug`, `vitc_mg`, `carotenoids_ug`.

Units are encoded in the field names: energy in kJ/kcal; macronutrients and several fatty acids in g or mg as indicated; minerals and vitamins in mg or µg as indicated. Every row has a numeric value in every per-100-g field (no blank or nonnumeric per-100-g cells in this workbook). This does **not** establish that a numeric zero means analytically confirmed absence rather than a missing/filled value; source-row provenance and missingness semantics are not included alongside every cell.

All 1,014 rows have a `servings_unit`. Per-serving values are present for 932 rows and entirely absent for the other 82 rows (3,198 empty per-serving cells); there are no partially populated per-serving rows.

## Workbook integrity and limitations

- Food codes and normalized recipe names are unique in the 1,014 rows; no duplicate codes or duplicate names were detected.
- Numeric nutrient cells contain no negative or nonnumeric values.
- All 39 per-100-g columns are populated, but nutrient-level source attribution and explicit “unknown/not measured” flags are absent from this workbook.
- A comparison of `energy_kj / 4.184` to `energy_kcal` differed by more than 1% (with a 0.1 kcal minimum tolerance) for 240 rows. This is a review flag, not proof of an error: methodology or energy factors may differ. The discrepancy should be clarified before using values for calculations.
- The source field is a broad category, not full row-level provenance. The workbook does not expose a source dataset identifier for each nutrient value, individual ingredient mapping, preparation state, or per-nutrient source.
- The workbook describes prepared/composite recipes. Recipe rows containing “split Bengal gram,” “urad dal,” “moong dal,” “fenugreek leaves,” “mustard seeds,” “ginger,” or “garlic” remain dish-level results, not raw ingredient records.
- Workbook storage is binary32-like spreadsheet numeric precision; values contain floating-point decimals. This is not a reason to round or replace values without source guidance.
- No workbook sheets or cells were rewritten, normalized, or added to the application database.

## Project suitability

The workbook may be useful for a separate, future **recipe comparison** after licensing and source provenance are resolved. It is not suitable as a source for the project's ingredient-level calculator in its current form. Similar recipe names are not ingredient identity matches, and per-100-g values of a cooked dish cannot replace the nutrition record for one ingredient.

For future ingredient coverage, prefer sources that explicitly provide item-level food records, original form/state, nutrient units, record-level citations, and a reuse licence. USDA FoodData Central and UK CoFID have official downloadable datasets; assess their licences and exact food forms record-by-record before adding anything. IFCT data remains a primary India-specific alternative, but the prior IFCT review identified NIN's restriction on electronic storage for creating a product without prior written permission.
