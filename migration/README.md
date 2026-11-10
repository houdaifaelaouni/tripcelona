# Migration workspace

- `urls.csv` — legacy URL inventory (US-03). Source: live Rank Math sitemaps fetched 2026-11-10 plus PRD §5.2. Still to add: Search Console top pages and any URLs with backlinks (needs owner's Search Console access).
- `content/` — one file per tour (US-02): current copy as observed on the live site, missing-fields checklist and image inventory.

Actions: `keep` = same path on the new site (trailing slash normalised); `301` = permanent redirect to `new_path`; `retire` = no replacement.
