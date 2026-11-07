# Phase 5.13.8 – Recipe PDF Evidence Validation

## Status: PARTIALLY COMPLETE

One expected PDF was present and parsed successfully; eight expected PDFs remain absent. The present file was compared with the corresponding production `sourceIngredients` list. No production data was changed, and this review does not mark the recipe verified.

## Inventory and PDF validation

| Measure | Result |
|---|---:|
| Expected PDFs | 9 |
| PDFs found recursively | 1 |
| Expected PDFs matched by filename | 1 (`masoor-dal.pdf`) |
| Unexpected PDFs | 0 |
| Duplicate expected filenames | 0 |
| Structurally parsed PDFs | 1 |
| Unreadable/invalid PDFs | 0 |
| Recipes compared | 1 (`masoor-dal`) |
| Recipes still awaiting a PDF | 8 |

`masoor-dal.pdf` is 1,868,512 bytes and begins with `%PDF-1.4`. PDF.js 4.10.38 parsed it and extracted readable text from a 26-page document. The recipe card and instructions are readable on pages 12–15. Pages 20–26 contain only repeated footer text; the full completeness of the captured page cannot be established.

The PDF metadata identifies Chrome 156 as Creator and Skia/PDF m156 as Producer. Its CreationDate is 2026-11-07 17:39:20 UTC. The footer displays `07/11/2026, 23:09`; its date order is ambiguous, though the time is consistent with the metadata timestamp in the project timezone. These details support classification as a browser-generated PDF but do not prove authenticity or that the file is unaltered.

Visible evidence:

- Publisher/site branding: **Swasthi's Recipes**, page title/footer (PDF pp. 1, 12).
- Recipe title: **Masoor Dal Recipe (Red Lentil Dal)** (pp. 1, 12).
- Author: **Swasthi Shreekanth** (pp. 1, 12).
- Update date: **April 6, 2025** (p. 1).
- Printed URL: `https://www.indianhealthyrecipes.com/masoor-dal-recipe/?utm_source=chatgpt.com` (pp. 1, 12–15); its path matches the production URL, with an added tracking query parameter.
- Yield: **2 to 3 servings** (p. 12).
- Ingredients: recipe card (p. 13); instructions and optional-use detail (pp. 13–15).

The visible attribution and URL support treating the PDF as reviewed source evidence, not as proof of authenticity, completeness, or recipe verification.

## Ingredient comparison

All **18** stored Masoor Dal source ingredient rows have corresponding entries on PDF page 13.

| Comparison | Count |
|---|---:|
| Exact/semantically matching ingredient rows | 14 |
| Quantity-detail differences (additional PDF notes) | 3 |
| Preparation/optionality detail difference | 1 |
| Ingredients missing from the application list | 0 |
| Additional ingredient identities in the PDF card | 0 |
| Unit mismatches | 0 |
| Ambiguous ingredient identities | 0 |
| Unreadable ingredient evidence | 0 |

The three quantity-detail differences are omissions of additional notes, not contradictions to the recorded main amounts:

1. **Water:** the PDF also gives an Instant Pot/moong-dal-specific amount on p. 13.
2. **Kashmiri red chili powder:** the PDF adds a heat-adjustment note to use up to ¾ teaspoon on p. 13.
3. **Garam masala:** the PDF adds “more if you want” on p. 13.

The optional-use detail is that the PDF directions say to add kasuri methi “if using” (p. 14), while the stored application source line does not label it optional. Full wording and page citations are in `pdf_ingredient_comparison.csv`.

## Remaining evidence gaps

- The PDF's visible URL includes `utm_source=chatgpt.com`; the URL path matches production, but the capture chain and lack of alteration cannot be independently established from the file alone.
- The final pages 20–26 contain only repeated footer text, so completeness of the browser capture is uncertain.
- Eight recipe PDFs were not found: Chana Masala, Rajma Masala, Aloo Gobi, Vegetable Upma, Paneer Bhurji, Palak Paneer, Matar Paneer, and Coconut Milk Pulao. They remain `awaiting_snapshot` and `not_reviewed`.
- Coconut Milk Pulao has no production `sourceIngredients` list; no ingredient list was inferred.
- Readable source evidence does not establish ingredient mappings, nutrition, recipe verification, or recommendation eligibility.

## Files created or updated

- Created `data/ingredient-coverage-audit/pdf_validation_report.csv`.
- Created `data/ingredient-coverage-audit/pdf_ingredient_comparison.csv`.
- Created this summary.
- Updated `data/recipe-source-snapshots/snapshot_manifest.csv` for the one present PDF; the eight absent recipes remain awaiting snapshots.
- No production recipe or ingredient records, nutrient values, mappings, verification states, or application logic were changed.
