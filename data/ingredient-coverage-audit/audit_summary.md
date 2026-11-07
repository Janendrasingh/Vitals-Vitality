# Phase 5.13.1 source-to-ingredient mapping reconciliation

## Scope and safeguards

This audit compared current source wording in `recipes.js` with each current recipe ingredient entry, the referenced production record identity/preparation/source fields, and the prior Phase 5.9-5.13 research reports. The crosswalk was reconstructed from current `sourceIngredients` and `recipe.ingredients`/`sourceQuantity`, not copied from the Phase 5.13 assignment script. Only audit reports were updated. Production nutrition, ingredient IDs, recipe definitions/mappings/quantities, validation, verification statuses, recommendations, Firebase, and user data were not changed.

Phase 5.13.2 independently matched all 151 reported source strings and source-list counts to the current recipe records and checked their citation metadata. Phase 5.13.3 retried all eight source-list URLs and the Coconut Milk Pulao URL on 2026-11-07; every page returned HTTP 403. No publisher-controlled alternative or local source-page snapshot was located, so the stored wording still lacks independent publisher-page confirmation.

## Source-row reconciliation

- Eight recipes have reviewable source lists containing **151 rows**; the previous total of 151 is confirmed by independently counting the current recipe records. Each source row appears exactly once in the coverage CSV.
- **71 source rows** have current catalog assignments containing **72 ingredient assignments**; the Vegetable Upma mixed-vegetable source row has two catalog components. **80 rows** have no current recipe assignment.
- Coconut Milk Pulao is recorded separately as **not_assessable**. Its source-row count is unknown, and its eight catalog-only entries are not treated as source mappings.

## Independent classification dimensions

Counts below are source-row counts except mapping assignments as explicitly stated. They are separate measures, not a combined match percentage. Identity classification is independent of whether the recipe currently has an assignment: candidate identities can be exact or approximate while the mapped ID fields remain blank and mapping verification is not applicable.

### Identity match

- Exact: **60**
- Approximate: **64**
- Unresolved: **27**
- Not assessable among available source rows: **0**; one separate Coconut Milk Pulao status record is not assessable.

Unresolved means no suitable catalog candidate supports the source identity. A related catalog record is classified approximate when an identity, variety, or form difference remains, even if the recipe has no assignment. Exact identity means the food identity/form is supported by the source wording and cited catalog description; it **does not** mean the recipe mapping is verified. For rows with no recipe assignment, candidate evidence is recorded without presenting the candidate as a mapped ingredient.

### Mapping verification

- Verified source-row mappings: **0**
- Unverified mapped source rows: **71**, covering **72 ingredient assignments**
- Rows without a current mapping: **80**. All existing mapped items still have `ingredientMatchStatus: unverified`; recipe composition and evidence remain unverified.

### Quantity precision

- Exact: **18** source rows
- Estimated: **130** source rows
- Unavailable: **3** source rows

Exact source weights or volumes/current exact recipe quantities remain exact, including amounts for optional items when selected; household measures, ranges, approximate conversions and combined mixed-ingredient quantities are estimated. “Ginger juliennes” and serving garnish without an amount are unavailable. The report retains the complete source line verbatim rather than inventing a normalized measure. The mixed-vegetable row has blank mapped grams because the source gives no separate component weights.

### Preparation match

- Exact: **2** mapped source rows (explicit dry/raw pulse branches)
- Different: **0**
- Unknown: **69** mapped source rows
- Not applicable: **80** unmapped source rows.

Most source lines do not specify enough raw/cooked, fresh/dried, whole/ground, skin, or physical-form detail for a positive preparation classification. These remain unknown rather than being inferred from cooking directions. No preparation contradiction is established among current mappings.

## Catalog and recipe status

- All **77** ingredient records remain represented in the existing inventory. Ingredient validation is **valid**, with 0 errors and 4 required-nutrient warnings.
- Four existing records still lack required fibre: canned coconut milk and the three CoFID split-pulse records. Missing values remain unavailable/null; none were converted to zero.
- All **9** recipes remain represented in the blocker report and all are ineligible under the existing verification gate. Eligible recipes: **0**. Verification statuses were not changed.
- **Zero verified recipes does not mean zero recipe records:** all 9 recipe records exist, but none currently satisfies the complete verification requirements. This coverage audit does not prove nutrition accuracy.

## Identity distinctions and alternatives

The audit does not equate chana dal with generic chickpeas; split urad chilki with duhli; split moong with whole mung; curry leaves with fenugreek; fenugreek seeds/raw leaves with kasuri methi; ginger-garlic paste with separate ingredients; garam masala with individual spices; tej patta with generic bay leaf; whole mustard with ground mustard; Kashmiri powder with generic dried chili; green and red chili; whole cinnamon/cloves with ground records; cumin seed with roasted powder; coriander leaves with seeds/powder; or fresh and canned coconut milk.

Alternatives are recorded as alternatives, not additive mandatory ingredients. The current crosswalk selects only one branch where present (e.g. dry chickpeas, dry rajma, green peas in the capsicum/peas row, cashews rather than almonds/cream, peanuts where Upma permits omitting cashews). Optional cream remains explicitly optional. No separate amounts are assigned to carrot, beans, and peas from Upma's combined vegetable measure.

## Gap and source-rights interpretation

The gap report separates missing ingredient records, missing recipe mappings despite an existing record, related-record form/identity mismatches, incomplete required nutrients, source quantity/recipe evidence gaps, and unresolved source rights. A source line without a recipe assignment is not automatically a missing nutrition record. Raw ginger/garlic, green beans, oils and ghee already have production records; generic bay leaf and ground mustard are related forms only; CoFID split urad/moong records exist but lack fibre; ginger-garlic paste remains a compound-composition gap.

IFCT nutrient values remain withheld pending prior written NIN permission. INDB raw-food records remain unavailable separately and workbook rights remain unconfirmed. The research article's open-access licence is not treated as a dataset licence.

## Files updated

- `recipe_coverage_audit.csv` - all source rows with four independent classification fields and one separate not-assessable Coconut Milk Pulao status record.
- `ingredient_gap_priorities.csv` - categorized source, mapping, data-completeness and rights gaps.
- `audit_summary.md` - reconciliation totals and interpretation.

Inventory, identity, and nine-recipe blocker reports were left unchanged.

## Recipe Source Evidence Review – Phase 5.13.3

- Recipes assessed for source status: **9** (8 stored source lists and Coconut Milk Pulao, whose source list remains unreviewed).
- Original stored pages accessible: **0**; inaccessible with HTTP 403: **9**.
- Publisher-controlled alternative sources found: **0**. No local source-page snapshot was located. Search-result snippets were not treated as recipe evidence.
- Recipes with ingredient wording fully supported by accessible source evidence: **0**. For the eight source-listed recipes, stored wording and quantities remain available only as unverified project transcriptions. Coconut Milk Pulao has no stored source ingredient list.
- Recipes with independently available source quantity, preparation, method, yield, and allergen evidence: **0** for each category.
- Confirmed source wording/quantity discrepancies: **0**. This does not establish that the stored wording is correct; comparison was impossible.
- Publisher/author metadata and publication/update dates remain unknown where they could not be confirmed from accessible publisher pages.

The per-recipe evidence and access results are recorded in `recipe_source_evidence.csv`; unresolved comparisons and future evidence needs are detailed in `source_discrepancy_report.md`. Page accessibility is not recipe verification: even an accessible page would not alone verify nutrition or ingredient mappings. All nine recipes remain estimated and ineligible.
