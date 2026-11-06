# INDB licensing assessment

## Conclusion

The downloadable INDB workbook's reuse licence is **unclear and unconfirmed**. Do not import its records into production, redistribute the workbook, or publish a derivative ingredient/recipe dataset until the data owners provide written permission or identify an explicit licence covering this workbook and its component sources.

## Evidence reviewed

1. **Official Anuvaad portal:** <https://www.anuvaad.org.in/indian-nutrient-databank/> describes the portal/database as “open-access” and links “Download Data” to `Anuvaad_INDB_2024.11.xlsx`. No explicit licence text for the XLSX was present in the inspected portal page/download section.
2. **Research article:** Vijayakumar et al., DOI <https://doi.org/10.1016/j.cdnut.2024.103790>, PMC <https://pmc.ncbi.nlm.nih.gov/articles/PMC11277795/>. NCBI's article metadata identifies the article licence as **CC BY 4.0**. That is a licence for the article; it does not, by itself, establish a licence for the separate workbook or all incorporated data.
3. **Article data availability:** the paper states that analysis code/files are publicly available from <https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB->. Public availability is not itself a reuse licence.
4. **Linked GitHub repository:** GitHub's repository licence endpoint returns `404 Not Found` (no detected repository licence). No `LICENSE` file appears in the repository file listing. The README says the IFCT 2017 and IFCT 2004 inputs must be requested from NIN, and describes incorporated UK CoFID, USDA, recipe manuals, and website recipes. This confirms that source-specific permissions matter.

Two open questions already exist in the linked repository: [issue #2](https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB-/issues/2) asks about licensing and original-source attribution, and [issue #3](https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB-/issues/3) asks about use in a commercial diet app. Both had no maintainer comments at the time checked. No duplicate public issue was opened for this evaluation.

## Reuse questions not resolved

The evidence does not establish whether the portal workbook may be:

- reused commercially;
- redistributed or mirrored;
- transformed into or used to publish derivative datasets;
- imported into a commercial application;
- attributed in a particular required form; or
- reused with all embedded sources (IFCT 2017/2004, UK CoFID, USDA, copyrighted recipe manuals, and website recipes) under one common grant.

The paper's CC BY licence permits reuse of the article under its terms, with attribution; it is not treated here as a grant for the workbook. The open portal and publicly downloadable GitHub files likewise do not supply the missing dataset licence.

## Permission request to send

No direct contact was sent during this evaluation; the repository already has two open, unanswered licensing questions linked above, so no duplicate issue was opened. Before using the data, obtain a written response from Anuvaad maintainers and/or the corresponding author confirming:

1. the licence and copyright owner for the exact `Anuvaad_INDB_2024.11.xlsx` workbook and the GitHub XLSX files;
2. permission for commercial use and incorporation in a nutrition-tracking application;
3. permission for redistribution and publication of normalized or derived records;
4. required attribution, source citation, notices, and any share-alike or downstream conditions;
5. whether those permissions cover all embedded data, including IFCT 2017/2004 records, UK CoFID, USDA data, recipe manuals, and web recipes, or whether separate permissions are required; and
6. whether raw ingredient composition tables are available under the same terms, as they are not in the downloaded portal workbook.

## Source-specific considerations

- **ICMR-NIN IFCT 2017/2004:** the linked repository README says these inputs must be requested from the original source. The project's previous IFCT review found a restriction on electronic storage for creating a product without prior written NIN permission. Obtain NIN's written permission before reproducing those values electronically.
- **UK CoFID:** the official GOV.UK page distributes CoFID 2021: <https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid>. Check the exact file's current reuse statement and any attribution requirements before use.
- **USDA FoodData Central:** official downloads are available at <https://fdc.nal.usda.gov/download-datasets.html>. Review USDA's terms and individual record provenance before import.
- **Recipe manuals and web recipes:** recipe text, selection, and compilation may have separate rights. Do not infer permission to reproduce recipe ingredients or directions from the article's licence.

## Safe next step

Request a written licence statement and item-level source permissions. Until then, retain only the locally staged workbook for private evaluation, do not add it to Git or production assets, and do not copy any nutrient values into project files. If permission is granted, scope any import to explicitly licensed item-level records, preserve exact source record IDs, original units/forms and per-field provenance, retain unavailable values as unavailable, and keep composite recipe nutrition separate from raw ingredients.
