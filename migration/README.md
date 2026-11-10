# Migration workspace

- `urls.csv` — legacy URL inventory (US-03). Source: live Rank Math sitemaps fetched 2026-11-10 plus PRD §5.2. Still to add: Search Console top pages and any URLs with backlinks (needs owner's Search Console access).
- `content/` — one file per tour (US-02): current copy as observed on the live site, missing-fields checklist and image inventory.

Actions: `keep` = same path on the new site (trailing slash normalised); `301` = permanent redirect to `new_path`; `retire` = no replacement (410 Gone); `pending` = waits on an owner decision or content, returns 404 until then.

## Content import (Sprint 8, US-31)

```bash
pnpm content:import --wxr ./export.xml --dry-run --report ./import-report.json
pnpm content:import --wxr ./export.xml          # or --wp-api https://tripcelona.com
```

- Source: a WordPress export (Tools → Export → All content). **The export contains
  customer data (quote requests); never commit it.** Only posts, pages, products and
  their FAQ blocks are read.
- Posts and pages are converted to the editor format word for word (breadcrumbs, repeated
  titles and plugin shortcodes removed; `[tripola dato]` kept). Pages whose slug belongs to
  a route of the new site are skipped, existing rows are kept unless `--overwrite`.
- Products only fill the description of an existing tour with the same slug.
- FAQs are replaced per source URL. Inline images are registered in `media` under
  `content/`.
- The report lists warnings: personal email addresses, empty pages (skipped),
  removed shortcodes, missing legal pages and future-dated products.
