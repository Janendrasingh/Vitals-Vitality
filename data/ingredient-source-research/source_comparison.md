# Phase 5.11: Licensed ingredient nutrition source comparison

## Executive summary

The existing production database contains 74 ingredient records. It already has raw ginger and raw garlic; it has related but non-equivalent records for whole mung beans, generic chickpeas, ground mustard seeds, fenugreek seeds, and a generic bay leaf. It does not have the requested split dals, curry leaves, asafoetida, dried fenugreek leaves, ginger-garlic paste, amchur, Kashmiri chili powder, or Indian tej patta as distinct records.

The best source candidates found are four ingredient identities in UK CoFID 2021: split mung beans, two distinct split urad forms, raw ginger, and raw garlic. USDA FoodData Central provides relevant exact records for raw ginger and raw garlic, already represented in production. No candidate has been imported.

Across the 13 target identities, the best source-level classification is:

| Classification | Ingredient identities |
|---|---:|
| Exact match | 4 |
| Possible/manual review | 6 |
| No suitable match found | 3 |

These are source identity results only; they do not satisfy the application's separate recipe-verification or nutrition-completeness requirements.

## Sources and access

### USDA FoodData Central

- Official portal and API: <https://fdc.nal.usda.gov/> and <https://fdc.nal.usda.gov/api-guide/>
- Foundation Foods and SR Legacy search results were inspected through the official API. The project already cites the SR Legacy records for raw ginger (FDC 169231) and raw garlic (FDC 169230).
- Seven relevant record candidates are listed in [usda_candidate_records.csv](./usda_candidate_records.csv), including form or identity near-misses. The two exact raw-food records are already in the production ingredient database.
- USDA describes FoodData Central data as public domain/CC0 1.0. Attribution is not a CC0 condition; retaining the FDC ID and record citation is still recommended for traceability.
- Direct detail requests became rate-limited/forbidden during this evaluation. Candidate nutrient values for existing SR Legacy records are taken from the project records that already cite those FDC IDs; search-result values for near-matches are recorded as candidate values, not newly imported records. No USDA bulk dataset was downloaded.

### UK CoFID 2021

- Official publication and download: <https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid>
- The official workbook was downloaded and inspected in an isolated research location. Workbook tabs include a food-code/factor sheet and separate proximate, inorganic, vitamin, and other nutrient sheets.
- The GOV.UK page states that its content is available under the Open Government Licence v3.0 except where otherwise stated. The licence permits commercial and non-commercial use, copying, distribution, and adaptation, subject to attribution and other licence conditions: <https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/>.
- Eleven directly relevant or form-near candidate records are listed in [cofid_candidate_records.csv](./cofid_candidate_records.csv). Four target identities have exact food-form matches in the CoFID descriptions: split mung dahl, split urad dahl (two dehulled/seed-coat forms), raw ginger, and raw garlic.
- CoFID describes nutrient values as per 100 g, except alcohol per 100 ml and selected fatty-acid tabs. This comparison uses the 1.3 Proximates sheet only. `N` means no reliable amount, `Tr` means trace, and blank cells remain unavailable; none is interpreted as zero.
- CoFID's source fields cite literature and prior datasets. Preserve those references and check any explicitly stated third-party rights before redistributing source-level extracts.

### INDB raw-food data

- Portal: <https://www.anuvaad.org.in/indian-nutrient-databank/>
- Paper: <https://pmc.ncbi.nlm.nih.gov/articles/PMC11277795/>
- The paper describes 1,095 raw-food items and 1,014 recipes. Its data-availability section points to the analysis repository: <https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB->.
- The repository's `INDB.xlsx` was inspected: one “Nutrient Data” sheet, 1,014 recipe rows plus a header, and 82 columns. It is not the raw-food dataset. The repository README says the IFCT 2017/2004 input files must be requested from ICMR-NIN; the listed public workbooks include recipe and supporting UK/US FCT files, not a separately downloadable 1,095-row raw-food table.
- The paper's CC BY 4.0 licence applies to the article, not automatically to the workbook or underlying records. No dataset licence establishing commercial reuse, redistribution, or derivative-data rights was found. Do not copy raw values from the research code/workbooks until the raw dataset and source-specific permissions are identified.

## Candidate outcomes by ingredient

The complete 13 x 3 source matrix is in [ingredient_match_matrix.csv](./ingredient_match_matrix.csv).

- **Exact:** urad dal (split, with seed coat and dehulled forms separately), split moong dal, raw ginger, and raw garlic.
- **Possible/manual review:** chana dal (USDA Bengal-gram records do not establish the split/dehulled form); asafoetida (CoFID resin description versus commercial compounded hing); kasuri methi (CoFID raw leaves, not dried); whole mustard seeds (CoFID description does not specify form); Indian tej patta (generic dried bay leaf does not establish species); Kashmiri chili powder (CoFID generic chili powder does not establish cultivar).
- **No suitable match:** curry leaves, ginger-garlic paste, and amchur.

Important rejected near-matches are documented rather than normalized: CoFID Kabuli chickpeas are not chana dal; whole USDA mung beans are not split mung dal; USDA ground mustard is not whole mustard; fenugreek seeds are not fenugreek leaves; unripe mango flesh is not amchur; and generic bay leaf is not established as Indian tej patta.

## Nutrient and traceability checks

- CoFID candidate food codes, original descriptions, original source references, and per-100-g proximates are included in the CSV.
- CoFID candidate codes were unique in the extracted set. All 11 selected rows have numeric water, protein, and fat values; 8 have numeric carbohydrate and energy values, while 3 report `N` for those fields. Numeric values in the selected rows were non-negative; unavailable `N` and trace `Tr` entries were preserved as text.
- USDA candidates include the FDC identifiers and data types. The two exact production values are already traced to FDC SR Legacy IDs 169230 and 169231. The FDC API's rate limit prevented a complete fresh nutrient-detail audit for every near-match.
- Candidate counts are 7 USDA record rows and 11 CoFID record rows; the INDB raw-food source yielded 0 accessible raw-food records. These counts include related-form near-misses and are not counts of eligible production records.
- Nutrient presence is not equivalent to recipe eligibility: the application also requires recipe quantity, preparation, cooking, yield, allergen, dietary, and nutrition evidence.

## Recommendation for a controlled import phase

Prioritize a separate review of CoFID raw split moong (13-098), raw split urad (13-058 chilki/partial coat and 13-060 duhli/no seed coat), and the already-present USDA raw ginger and garlic records. Preserve each pulse form as a separate identity. Do not overwrite or merge existing whole-mung, generic chickpea, or ground-mustard records. For candidates with incomplete proximate fields or uncertain identity, obtain product/source confirmation and retain missing nutrients as unavailable. Do not use any INDB raw data until written reuse rights and the raw dataset itself are obtained.

No production ingredient or recipe data was changed in this research phase.

## Phase 5.12 controlled import update

The official CoFID 2021 workbook was re-opened and the three source rows were independently checked across the Factors, Proximates, Inorganics, and Vitamins sheets. CoFID codes 13-058 (split chilki urad with partial seed coat), 13-060 (split duhli urad with no seed coat), and 13-098 (split mung dahl with no seed coat) are explicitly dry/raw forms. The workbook states that nutrient values are per 100 g; each row's main data reference is retained in production metadata.

Those three records were added as distinct, **unverified** ingredient records. CoFID has no numeric AOAC fibre value for these foods and marks NSP as `N`; that is not treated as zero or as equivalent to dietary fibre. `fibre` is therefore `null`, so the records remain incomplete for required meal calculations and cannot make recipes recommendable. Other source `N`, trace, and blank values likewise remain unavailable; source-reported zero values remain numeric zero. Existing whole mung, chickpea, and other ingredient records were not overwritten.

CoFID's official page offers its content under OGL v3.0 except where otherwise stated. The source rows' cited 1991 supplemental food-composition reference is preserved. No row-specific third-party restriction is declared in the inspected workbook; any future evidence of such a restriction must override this import decision. Attribution is recorded in each ingredient's source metadata. No recipe, recipe mapping, verification, calculation, recommendation, or Firebase data was changed.
