# INDB raw-food data access report

## Finding

The 1,095-row raw-food nutrient dataset described in the paper was **not found as a separate public download** in the official portal or the linked project repository. No raw-food nutrient values were copied into the project.

## What was checked

1. The official Anuvaad portal's downloadable workbook, previously inspected in Phase 5.10, is a recipe-level workbook with 1,014 recipe records, not the 1,095 raw-food records.
2. The paper reports 1,095 raw food items and 1,014 recipes and says that the analysis code/files are publicly available from <https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB->.
3. The repository root contains `INDB.xlsx`, `INDB.do`, `recipes.xlsx`, and supporting workbooks such as `UK_fct.xlsx` and `US_fct.xlsx`. The repository `INDB.xlsx` was independently downloaded to temporary research storage and inspected: it has one “Nutrient Data” sheet, 1,014 data rows plus a header, and 82 columns. It is the recipe dataset, not a raw-food table.
4. The repository README identifies seven required data files and says the IFCT 2017 and IFCT 2004 inputs must be requested from the original source (ICMR-NIN). The publicly listed recipe files and supporting foreign FCT workbooks do not include a separate 1,095-record raw-food export.
5. The article's Data availability section identifies the repository but does not itself grant rights to the separate dataset or its source tables.

## Access and permission needed

- Request the exact raw-food workbook/table and its version from the INDB authors/maintainers.
- Ask for written terms covering commercial incorporation, redistribution, derivative datasets, attribution, and rights for each underlying source.
- Request IFCT 2017/2004 source access and explicit written electronic reproduction/product-use permission from ICMR-NIN. The project's earlier IFCT review identified a restriction on electronic storage for creating a product without prior written permission.
- Obtain separate source-specific rights/attribution for CoFID, USDA, and any other data incorporated into the raw-food records.

The research paper is open access under CC BY 4.0; this is not treated as a licence for the raw workbook or the underlying IFCT data. Until rights and the raw file are confirmed, the dataset is not suitable for import.

## Traceability

- Paper: <https://pmc.ncbi.nlm.nih.gov/articles/PMC11277795/>
- Article-linked repository: <https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB->
- Official portal: <https://www.anuvaad.org.in/indian-nutrient-databank/>
- Current public recipe download was inspected in Phase 5.10; the repository `INDB.xlsx` was inspected in Phase 5.11. The repository copy was held only in temporary research storage and is not included in the project.
