# Phase 5.13.5 – Independent Recipe Source Comparison

## Status: PARTIALLY COMPLETE

The snapshot directory was checked recursively on **2026-11-07**. No PDF files were present. Therefore, no publisher PDF content could be extracted or independently compared with the source ingredient records in `src/nutrition/database/recipes.js`. No source wording, quantities, preparation details, methods, yields, or publisher metadata are inferred.

## Snapshot availability

| Recipe ID | Recipe | Expected PDF | Snapshot status | Stored source ingredient rows |
|---|---|---|---|---:|
| `masoor-dal` | Masoor Dal | `masoor-dal.pdf` | awaiting_snapshot | 18 |
| `chana-masala` | Chana Masala | `chana-masala.pdf` | awaiting_snapshot | 20 |
| `rajma-masala` | Rajma Masala | `rajma-masala.pdf` | awaiting_snapshot | 18 |
| `aloo-gobi` | Aloo Gobi | `aloo-gobi.pdf` | awaiting_snapshot | 19 |
| `vegetable-upma` | Vegetable Upma | `vegetable-upma.pdf` | awaiting_snapshot | 18 |
| `paneer-bhurji` | Paneer Bhurji | `paneer-bhurji.pdf` | awaiting_snapshot | 15 |
| `palak-paneer` | Palak Paneer | `palak-paneer.pdf` | awaiting_snapshot | 18 |
| `matar-paneer` | Matar Paneer | `matar-paneer.pdf` | awaiting_snapshot | 25 |
| `coconut-milk-pulao` | Coconut Milk Pulao | `coconut-milk-pulao.pdf` | awaiting_snapshot | 0 |

The eight stored ingredient lists total **151 application source rows**. Each row is represented in `recipe_source_comparison.csv` as awaiting evidence, not as a confirmed match or discrepancy. Coconut Milk Pulao has no stored source ingredient list; its row records that there is no list to compare.

## Comparison result

- Expected recipe PDFs present: **0 of 9**.
- Stored source ingredient rows awaiting comparison: **151**.
- Recipes without a stored source ingredient list: **1** (Coconut Milk Pulao).
- Confirmed exact matches or discrepancies: **0**; no comparison was possible.
- PDF page citations: **none**; page fields and evidence references are blank because no PDF exists.
- Publisher, author, publication/update metadata and source recipe details from PDFs: **not available**.

The comparison CSV marks each source row `awaiting_snapshot` and `unreadable_or_unavailable_evidence`. This is not a finding that application wording is right or wrong. In particular, ingredient missing from application records/PDF, quantity mismatch, unit mismatch, preparation mismatch, and ambiguous identity cannot be assessed without source content.

The snapshot manifest now records `awaiting_snapshot` and the date the absent files were checked. `snapshot_date` and source metadata remain blank; all recipes remain `not_reviewed`. No absent recipe is marked reviewed.

## Evidence and integrity notes

- Only the exact expected PDF files in the manifest would be considered for this comparison. No alternative publisher recipes or search snippets were substituted.
- No PDF page numbers or evidence references have been fabricated.
- Phase 5.13.3's finding that publisher pages were inaccessible remains separate from this snapshot availability check; a missing PDF does not establish a new HTTP response.
- Presence of a future PDF will not by itself establish authenticity, completeness, or recipe verification. Its provenance and page contents must be reviewed first.
- No production recipes, ingredients, nutrients, mappings, verification states, or application logic were changed.

## Remaining work

Provide original publisher-page snapshots using the intake instructions in `data/recipe-source-snapshots/README.md`. Then review each PDF for provenance and completeness, cite page numbers for each supported comparison, and record any differences without changing production data.
