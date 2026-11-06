# INDB workbook structure and quality report

## Workbook

- Official portal: <https://www.anuvaad.org.in/indian-nutrient-databank/>
- Official portal workbook URL: <https://www.anuvaad.org.in/wp-content/uploads/2020/07/Anuvaad_INDB_2024.11.xlsx>
- Workbook name: `Anuvaad_INDB_2024.11.xlsx`
- Local inspection copy: `%TEMP%\Anuvaad_INDB_2024.11_phase510.xlsx` (not committed or copied into production data)
- Size: 1,063,574 bytes
- SHA-256: `c39023890f45b86b7f68578a4f740c5772234402111054c28a7a867d8dda25d9`
- Parser: Python 3.12.10, `openpyxl` 3.1.5, read-only and `data_only`

## Sheets and dimensions

| Sheet | Rows including header | Data records | Columns | Contents |
|---|---:|---:|---:|---|
| `Sheet1` | 1,015 | 1,014 | 82 | Recipe identifiers, recipe-level nutrient values per 100 g and per serving |

There are no raw-food/ingredient sheets in the portal workbook.

## Columns

- Identifiers: `food_code`, `food_name`, `primarysource`
- Per 100 g: 39 nutrient columns (see list below)
- Serving descriptor: `servings_unit`
- Per serving: corresponding 39 nutrient columns prefixed `unit_serving_`

Per-100-g fields and units from their names:

| Field | Unit | Field | Unit |
|---|---|---|---|
| `energy_kj` | kJ | `energy_kcal` | kcal |
| `carb_g` | g | `protein_g` | g |
| `fat_g` | g | `freesugar_g` | g |
| `fibre_g` | g | `sfa_mg` | mg |
| `mufa_mg` | mg | `pufa_mg` | mg |
| `cholesterol_mg` | mg | `calcium_mg` | mg |
| `phosphorus_mg` | mg | `magnesium_mg` | mg |
| `sodium_mg` | mg | `potassium_mg` | mg |
| `iron_mg` | mg | `copper_mg` | mg |
| `selenium_ug` | µg | `chromium_mg` | mg |
| `manganese_mg` | mg | `molybdenum_mg` | mg |
| `zinc_mg` | mg | `vita_ug` | µg |
| `vite_mg` | mg | `vitd2_ug` | µg |
| `vitd3_ug` | µg | `vitk1_ug` | µg |
| `vitk2_ug` | µg | `folate_ug` | µg |
| `vitb1_mg` | mg | `vitb2_mg` | mg |
| `vitb3_mg` | mg | `vitb5_mg` | mg |
| `vitb6_mg` | mg | `vitb7_ug` | µg |
| `vitb9_ug` | µg | `vitc_mg` | mg |
| `carotenoids_ug` | µg | | |

## Food/recipe provenance

The workbook's `primarysource` distribution is:

| Value | Rows | Interpretation documented by the linked repository README |
|---|---:|---|
| `asc_manual` | 490 | *The Art & Science of Cooking* recipes |
| `bfp_manual` | 376 | *Basic Food Preparation* recipes |
| `open_source_recipes` | 148 | Recipes collected from websites |
| **Total** | **1,014** | |

The source category does not provide complete source-level provenance per nutrient cell. The linked repository README describes separate IFCT 2017/2004, UK CoFID, USDA FCT, recipe ingredient, serving-size, recipe-link, and nutrient-retention files used to construct the combined work. It states the IFCT 2017/2004 data must be requested from NIN. Those separate ingredient files are not included as sheets in the downloaded portal workbook.

## Completeness and numeric checks

| Check | Result |
|---|---:|
| Missing food codes / names | 0 / 0 |
| Duplicate food codes / normalized recipe names | 0 / 0 |
| Missing per-100-g nutrient cells | 0 of 39,546 |
| Nonnumeric per-100-g nutrient cells | 0 |
| Negative numeric nutrient cells | 0 |
| Rows with all per-serving values present | 932 |
| Rows with all per-serving values absent | 82 |
| Rows with partially populated per-serving values | 0 |
| Missing per-serving nutrient cells | 3,198 |
| Rows missing `servings_unit` | 0 |
| Formula cells | 0 |
| Rows where `energy_kj / 4.184` differs from `energy_kcal` by >1% (minimum tolerance 0.1 kcal) | 240 |

The energy conversion difference is a follow-up flag, not a confirmed data error. The workbook's populated numeric zeros cannot be distinguished from explicit analytical zeros versus values substituted for unavailable data without source-specific missingness metadata. The article describes gaps filled from UK and US FCTs; the workbook does not attach a per-cell source/missingness marker.

## Relevance to requested ingredients

The workbook has 1,014 recipe-level nutrient records and **zero raw ingredient nutrient records**. Searches of the 10 requested identities found 37 unique recipe-title mentions, but none is a safe match to a raw ingredient. For example, “Washed moong dal,” “Carrot and fenugreek leaves,” and “Mustard seeds baghar” are recipe rows. Their nutrient totals include a preparation or composite dish and cannot be assigned to raw moong dal, fenugreek leaves, or mustard seed.

The downloadable workbook therefore has no food-state or raw-versus-cooked ingredient records suitable for importing into `ingredients.js`.
