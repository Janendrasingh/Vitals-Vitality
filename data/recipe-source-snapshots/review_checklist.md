# Recipe source snapshot review checklist

Use one checklist per expected recipe PDF. A file scan updates presence information only; it does not mark a source reviewed or a recipe verified. Do not edit production recipe records during intake or source review.

## Intake scan

- [ ] Scan `data/recipe-source-snapshots/` recursively and note the scan date.
- [ ] Match each file to the exact expected filename in `snapshot_manifest.csv`.
- [ ] Record `actual_file_present`, `actual_relative_path`, and `file_size_bytes`. Leave size/path blank when absent.
- [ ] Report unexpected PDFs without deleting, moving, or renaming them.
- [ ] Confirm extension and inspect the file signature when possible. A `.pdf` extension or `%PDF-` header alone does not prove a structurally valid PDF.
- [ ] Open/parse the PDF with a PDF reader and inspect all pages. Record whether it opens, page count, legibility, missing pages, cropping, and truncation.
- [ ] If the expected PDF is absent, use `evidence_status=awaiting_snapshot`.
- [ ] If present but not reviewed for source/content, use `evidence_status=snapshot_present_not_reviewed` and `review_status=not_reviewed`.
- [ ] If it cannot be opened or is structurally unreadable, use `evidence_status=unreadable_snapshot`.

## Evidence-status meanings

Use only these `evidence_status` values:

- `awaiting_snapshot` — expected file is absent.
- `snapshot_present_not_reviewed` — a candidate file is present, but its source and contents have not been reviewed.
- `reviewed_source_evidence` — document is readable and the source identity and relevant contents have been reviewed; this is not recipe/nutrition verification.
- `unreadable_snapshot` — file is present but cannot be reliably opened or read.
- `wrong_recipe_source` — readable evidence is demonstrably for a different recipe/source.
- `publisher_identity_unconfirmed` — content may be relevant, but the publisher/source cannot be sufficiently attributed.

Do not promote a present file to `reviewed_source_evidence` based only on filename, file type, or a PDF signature. `review_status` remains `not_reviewed` until a person has examined the document; it must not imply that production verification requirements are satisfied.

## Intake and provenance

- [ ] Manifest recipe ID, recipe name, original publisher URL, and expected filename match production.
- [ ] Identify the evidence type: original publisher PDF, publisher-controlled print page, or browser-generated PDF from the original publisher page. Clearly label screenshots, manual transcriptions, and third-party reproductions as secondary evidence.
- [ ] For browser-generated PDFs, record original URL and capture date; do not imply the PDF itself proves authenticity.
- [ ] Record snapshot date only when known.
- [ ] A matching filename alone does not establish authenticity or completeness.

## Source metadata

Record only what is visible and attributable; leave unknown values blank.

- [ ] Publisher.
- [ ] Recipe title.
- [ ] Author.
- [ ] Original URL and any displayed canonical URL.
- [ ] Publication date.
- [ ] Update date.
- [ ] Source attribution or copyright notice, if available.

## Recipe content comparison

- [ ] Ingredient names and wording.
- [ ] Quantities and units.
- [ ] Preparation states and forms (for example raw/cooked, fresh/dried, whole/ground, split/dehulled).
- [ ] Optional ingredient labels and alternative branches; do not count alternatives additively.
- [ ] Cooking instructions, sequence, and method options.
- [ ] Serving yield and serving count.
- [ ] Allergen statements or warnings, if available.
- [ ] Stated substitutions, exclusions, or variations.

## Discrepancy handling

- [ ] Compare evidence with the stored source list without assuming either is correct.
- [ ] Cite PDF page number(s) for every comparison or discrepancy.
- [ ] Record exact stored wording, evidence wording, evidence URL/page, evidence type, confidence, and affected dimension.
- [ ] Distinguish a confirmed difference from information that is absent or illegible.
- [ ] State source-authentication or completeness limitations explicitly.
- [ ] Do not invent wording, quantities, preparation, methods, yields, or allergens.
- [ ] Do not alter ingredient records, mappings, nutrition, or recipe verification statuses.
