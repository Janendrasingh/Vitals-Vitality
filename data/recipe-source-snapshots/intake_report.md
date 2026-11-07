# Recipe Source Snapshot Intake Report

**Scan date:** 2026-11-07
**Project phase:** 5.13.7 – Manual Recipe Evidence Collection and Intake
**Status:** PARTIALLY COMPLETE

## Current inventory

At the original Phase 5.13.7 scan, no PDFs were present. In the later Phase 5.13.8 inspection on the same date, one PDF (`masoor-dal.pdf`) was found recursively, parsed, and compared. See `data/ingredient-coverage-audit/pdf_evidence_summary.md` for page-level validation and comparison results.

| Measure | Result |
|---|---:|
| Expected recipe PDFs | 9 |
| PDFs actually present | 1 |
| Structurally parsed PDFs | 1 |
| Unreadable or invalid PDFs | 0 |
| Unexpected PDFs | 0 |
| Recipes awaiting snapshots | 8 |

`masoor-dal.pdf` has a valid PDF signature, was parsed as a 26-page PDF, and contained readable recipe-card text. Its presence does not establish authenticity, completeness, or recipe verification. The other eight expected PDFs remain absent.

## Expected files

| Recipe ID | Recipe | Expected filename | Evidence status |
|---|---|---|---|
| `masoor-dal` | Masoor Dal | `masoor-dal.pdf` | `reviewed_source_evidence` |
| `chana-masala` | Chana Masala | `chana-masala.pdf` | `awaiting_snapshot` |
| `rajma-masala` | Rajma Masala | `rajma-masala.pdf` | `awaiting_snapshot` |
| `aloo-gobi` | Aloo Gobi | `aloo-gobi.pdf` | `awaiting_snapshot` |
| `vegetable-upma` | Vegetable Upma | `vegetable-upma.pdf` | `awaiting_snapshot` |
| `paneer-bhurji` | Paneer Bhurji | `paneer-bhurji.pdf` | `awaiting_snapshot` |
| `palak-paneer` | Palak Paneer | `palak-paneer.pdf` | `awaiting_snapshot` |
| `matar-paneer` | Matar Paneer | `matar-paneer.pdf` | `awaiting_snapshot` |
| `coconut-milk-pulao` | Coconut Milk Pulao | `coconut-milk-pulao.pdf` | `awaiting_snapshot` |

The recipe IDs, names, original publisher URLs, and expected filenames in `snapshot_manifest.csv` were checked against `src/nutrition/database/recipes.js`. Snapshot metadata is populated only for the readable Masoor Dal PDF; unknown metadata for the eight absent snapshots remains blank.

## Intake procedure

For each recipe, open the exact original publisher URL from the manifest in Chrome, press **Ctrl + P**, choose **Save as PDF**, use the exact expected filename, and place the file in this directory. If the page remains inaccessible, do not bypass controls or substitute another recipe; leave the PDF absent and note the access attempt/date. Unknown metadata stays blank.

On the next audit, scan recursively, record actual relative path and byte size, inspect the PDF signature, and open/parse the file. A `.pdf` extension or `%PDF-` header alone is not structural validation, proof of authenticity, or recipe verification. Unexpected PDFs must be reported and preserved.

## Files and protected data

Created or updated for this intake workflow:

- `data/recipe-source-snapshots/README.md`
- `data/recipe-source-snapshots/review_checklist.md`
- `data/recipe-source-snapshots/snapshot_manifest.csv`
- `data/recipe-source-snapshots/intake_report.md`

Production recipes, ingredient records, nutrient values, mappings, recommendation eligibility, verification statuses, Firebase configuration, Firestore, and user data were not changed. No application code changed; tests/build were not run.
