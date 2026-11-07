# Phase 5.13.6 – Alternative Recipe Source Evidence Acquisition

## Status: PARTIALLY COMPLETE

Research was performed on **2026-11-07** using the nine recipe IDs and original source URLs read from `src/nutrition/database/recipes.js`. The publisher is treated as Indian Healthy Recipes based on the stored production provenance; individual recipe pages could not be opened to independently confirm page identity.

## Results

- Recipes with accessible original recipe pages: **0 of 9**.
- Recipes still inaccessible: **9 of 9**; each original URL returned HTTP 403.
- Publisher-controlled alternative recipe content, official print pages, recipe PDFs, and accessible structured recipe data obtained: **0**.
- Recipe ingredient quantities, preparation details, instructions, and yields verified from alternative evidence: **0**.
- Local browser/saved-page evidence found in `data/recipe-source-snapshots/`: **none** (manifest and intake guidance only).

Per-recipe outcomes, URLs, access statuses, evidence references, and limitations are in `alternative_source_access_report.csv`.

## Publisher-controlled endpoints checked

| Endpoint | Result | What it establishes |
|---|---|---|
| `https://www.indianhealthyrecipes.com/robots.txt` | Accessible | Robots directives only: general user agents, `/wp-admin/` disallowed, and `/wp-admin/admin-ajax.php` allowed. It provides no recipe content or alternative recipe URLs. |
| `https://www.indianhealthyrecipes.com/sitemap_index.xml` | Accessible | A WordPress/Yoast sitemap index listing `post-sitemap.xml`, `post-sitemap2.xml`, `page-sitemap.xml`, and `category-sitemap.xml`. The index's `lastmod` timestamps describe sitemap files, not individual recipe publication/update dates. |
| `https://www.indianhealthyrecipes.com/wp-sitemap.xml` | Redirected to sitemap index | Same sitemap-index result; no recipe content. |
| `https://www.indianhealthyrecipes.com/post-sitemap.xml` and `.../post-sitemap2.xml` | No extractable URL entries returned | Could not confirm recipe-specific sitemap entries or obtain alternative recipe URLs through this access path. |
| `https://www.indianhealthyrecipes.com/wp-json/` and a public search endpoint under `/wp-json/wp/v2/search` | HTTP 403 | No WordPress REST metadata or recipe content was accessible. |
| Publisher homepage, `/about/`, `/contact/`, `/feed/`, and a recipe-specific feed path | HTTP 403 | No publisher profile, RSS recipe content, or other recipe evidence was accessible through these requests. |

All nine original recipe URLs independently returned HTTP 403 during this phase. Because the original pages were inaccessible, no page links, print controls, official print views, downloadable recipe files, canonical URL alternatives, or page-embedded structured recipe data could be inspected. Those possibilities are recorded as **not assessable / not located**, not as proof that the publisher does not offer them.

## Evidence interpretation and limitations

- The accessible robots file and sitemap index are publisher-hosted site metadata only. They do not support recipe wording, quantities, preparation, instructions, yield, authorship, or publication dates.
- No search-result snippets were used as recipe evidence.
- No third-party copies or similar recipes were used.
- No alternative recipe content was obtained, so the existing source ingredient transcriptions remain unconfirmed.
- Sitemap `lastmod` values were not treated as recipe publication/update dates.
- No PDFs or other saved browser evidence were present. The snapshot manifest was left unchanged because no source documents were obtained.
- A future accessible page or document must still be reviewed for provenance and completeness; accessibility alone does not verify ingredient mappings, nutrition, or recipe status.

## Files and protected data

Created `alternative_source_access_report.csv` and this summary. Production recipes, ingredient records, nutrient values, recipe mappings, verification statuses, recommendation logic, Firebase/Firestore, authentication, and user data were not modified. The existing snapshot manifest and all prior worktree changes were preserved.

## Next steps

If the publisher's pages remain inaccessible through normal public access, request an authorized copy or use the publisher's own print/download option if the publisher makes one available. Record the source URL and capture date, then review the document against the existing source ingredient records without replacing or silently reconciling differences.
