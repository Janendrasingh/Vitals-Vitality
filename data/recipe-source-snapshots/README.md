# Recipe source snapshot intake

This directory is for evidence from the original publisher pages for the nine recipes in [snapshot_manifest.csv](./snapshot_manifest.csv). The manifest records file discovery separately from source review. A PDF being present does not verify its source, recipe content, ingredients, or nutrition.

## Save a page as PDF in Chrome

For each recipe:

1. Open the exact `original_publisher_url` from the manifest in Chrome.
2. If the original publisher page opens, press **Ctrl + P**.
3. In the print dialog, select **Save as PDF**.
4. Save the PDF using the exact `expected_filename` shown for that recipe.
5. Place the PDF in this `data/recipe-source-snapshots/` directory.
6. Preserve the complete page as printed, including recipe title, ingredient quantities, instructions, yield, and source attribution where available. Do not edit, rewrite, or reconstruct it.

If the page remains inaccessible, do not bypass access controls and do not use a similar recipe or third-party copy as a substitute. Leave the PDF absent. Record the access attempt and date in `notes`; keep `evidence_status` as `awaiting_snapshot`. Do not create a placeholder PDF.

## What the next intake audit checks

The next audit should scan this directory and its subdirectories recursively, then match files by the exact expected filename. It should report unexpected PDFs without moving or deleting them. For each expected file, record its relative path, byte size, detected file type, and signature check in the manifest.

A `.pdf` extension or a `%PDF-` header alone is not enough to call a file structurally valid, authentic, complete, or reviewed. When a PDF is present, try opening/parsing it with a PDF reader, inspect its pages for legibility and completeness, and confirm its provenance before recording source metadata. If it cannot be parsed/opened, use `unreadable_snapshot`. Do not describe a header-only check as full structural validation.

## Evidence provenance and metadata

Distinguish among an original publisher PDF, a publisher-controlled print page, and a browser-generated PDF of the original publisher page. For a browser-generated PDF, record the original URL and capture date in the manifest notes and snapshot-date field. Record publisher, recipe title, author, and publication/update date only when visible and attributable. Leave unknown metadata blank.

Screenshots, manually transcribed text, and third-party reproductions are secondary evidence; label them clearly and do not silently substitute them for an original publisher source. A matching filename does not establish authenticity. Never treat a PDF's presence as recipe verification or alter production recipe records based on an unreviewed snapshot.
