# IFCT 2017 extraction and ingredient locator report

## Status

The official IFCT 2017 PDF downloaded successfully from <https://www.nin.res.in/ebooks/IFCT2017.pdf>. The PDF is 12,401,190 bytes, has 585 pages, and has SHA-256 `7fc5a5112a57240d25bf695dca82cccd8d93ed54e8c39530e42b5ad1820d0e8c`. Its title page identifies *Indian Food Composition Tables* and the National Institute of Nutrition / Indian Council of Medical Research. The citation is printed on PDF page 3.

The PDF was opened and processed with PyMuPDF 2.1. All 585 pages were checked. 550 pages contain more than 100 selectable text characters; 35 are sparse or have no selectable text, and 16 of those contain embedded images. Sparse pages may be blank, scanned, or image-heavy; no OCR was used. Selectable text was sufficient to locate table headings, food names, codes, and index pages. It is not proof that nutrient-table columns can be reliably reconstructed.

## Copyright and extraction scope

The PDF's copyright notice on page 3 states that reproduction for personal use is permitted with acknowledgment, but electronic storage or reproduction for creating a product requires prior written permission from NIN. Because no such permission was provided, this project does **not** copy the IFCT nutrient tables or values into electronic dataset files.

Consequently:

- Nutrient records extracted: **0**
- Nutrient records with traceable table/page references: **0**
- Nutrient records validated: **0**
- The CSV is intentionally header-only; the extracted JSON contains an empty `records` array.
- A limited ingredient-name/code locator index is provided for the requested manual comparison. It is not a searchable nutrient dataset and must not be used to calculate nutrition.
- Original nutrient units and nutrient values are not asserted in the locator index. Table 1 is identified as “Proximate Principles and Dietary Fibre”; other table names are listed in the book's contents on PDF page 7, but their values were not extracted.

The preface (PDF page 5) describes 528 key foods and 151 food components, and states that, except for eggs, the food-component data are for foods in raw form. This is document-level information, not a row-by-row preparation-state extraction.

## Ingredient locator and match report

The records below are candidate locators only. PDF page numbers are one-based physical page numbers in the downloaded PDF. Table 1 is identified from its heading on PDF page 41 and the contents on page 7. The food-code index pages provide an additional cross-reference. No nutrient cells were copied.

| Existing ingredient | Candidate IFCT record | Table / PDF page; index page | Classification | Assessment |
|---|---|---|---|---|
| Chana dal | B001, Bengal gram, dal (*Cicer arietinum*) | Table 1 / p. 42; index p. 482 | Possible | Bengal gram dal is the relevant pulse identity, but the reviewed entry does not establish split/dehulled state. Not interchangeable with generic chickpeas. |
| Urad dal (split black gram) | B003, Black gram, dal (*Phaseolus mungo*) | Table 1 / p. 42; index p. 482 | Possible | Relevant black-gram dal form; split and skin status need manual verification. |
| Moong dal (split mung bean) | B010, Green gram, dal (*Vigna radiata*) | Table 1 / p. 42; index p. 483 | Possible | Relevant dal entry, but the reviewed description does not establish the requested split/dehulled form. |
| Curry leaves | G010, Curry leaves (*Murraya koenigii*) | Table 1 / p. 54; index p. 520 | Exact identity | Food name and botanical identity match. This does not authorize nutrient import without permission and record review. |
| Asafoetida | G019, Asafoetida (*Ferula assa-foetida*) | Table 1 / p. 54; index p. 522 | Possible | Relevant identity, but the specific form and any commercial-compound composition are not established. |
| Kasuri methi (dried fenugreek leaves) | C020, Fenugreek leaves (*Trigonella foenum-graecum*) | Table 1 / p. 44; index p. 489 | Possible, not exact | Botanical match, but IFCT states foods are raw except eggs; fresh/raw leaves cannot be used as dried kasuri methi values. |
| Garam masala | None found | Full-text search; no candidate locator | Unavailable | No matching compound blend found. |
| Amchur (dried mango powder) | None found | Full-text search; no candidate locator | Unavailable | No dried mango powder record found; other mango forms are not substitutes. |
| Kashmiri chili powder | G022, Chillies, red (*Capsicum annum*) | Table 1 / p. 54; index p. 522 | Unavailable for this form | Generic red chillies do not establish Kashmiri cultivar or dried/powder form. |
| Whole mustard seeds | H013, Mustard, seeds (*Brassica nigra*) | Table 1 / p. 55; index p. 526 | Possible | Candidate is species-specific; verify species and whole-versus-ground use for the recipe. |
| Ginger-garlic paste | None found | Full-text search; no candidate locator | Unavailable | Separate ginger and garlic records do not establish a paste composition. |
| Indian tej patta | None found | Full-text search; no candidate locator | Unavailable | No matching tej patta or bay-leaf record found. Unrelated leaves are not substitutes. |

### Match totals

- Exact ingredient-identity matches: **1**
- Possible matches requiring manual review: **6**
- Unavailable exact-form matches: **5**
- Distinct IFCT candidate food locators: **8**
- Full nutrient records extracted / validated: **0 / 0**

“Exact identity” describes the name/botanical match only; it is not a claim that the recipe quantity, preparation, allergens, or nutrient values were verified.

## Validation and limitations

- The file opens as PDF 1.7 and the official publication title, publisher, and citation were confirmed in its front matter.
- All 585 pages were inspected for selectable-text coverage and searched for the target food names and forms.
- Food-code and page locators were checked against both the nutrient-table text and the book's food-code index.
- Nutrient columns were **not** parsed or validated. No value or unit is copied, guessed, or treated as zero.
- 35 pages lack substantial selectable text; image presence alone does not establish that OCR or table extraction would be accurate.
- Exact form distinctions remain unresolved for pulse dals, asafoetida product form, dried fenugreek leaves, and mustard-seed species/use.
- The source restriction prevents creating the requested electronic nutrient dataset for a product absent prior written permission from NIN. The practical next step for full nutrient extraction is to obtain that written permission or an official structured dataset/license expressly allowing this use.

## Files

- `ifct2017_extracted.json` — extraction status and empty nutrient-record array; no values copied.
- `ifct2017_extracted.csv` — schema header only; no nutrient rows.
- `ifct2017_source_index.json` — source metadata, limited candidate locators, and ingredient-match classifications.
- `ifct2017_extraction_report.md` — this report.

Production `ingredients.js`, recipe mappings, validation rules, recommendation behavior, Firebase configuration/schema, and user data were not modified by Phase 5.9.
