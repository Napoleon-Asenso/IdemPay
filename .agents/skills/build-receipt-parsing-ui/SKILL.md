---
name: build-receipt-parsing-ui
description: Skill for constructing the three Assessment 3 receipt-parsing views (Upload, Processing, Result) using design-system CSS variables from matisse-tokens.css and Tailwind CSS.
version: 1.0.0
---

# BUILD RECEIPT PARSING UI SKILL

## Trigger Conditions

Activate this skill whenever creating, modifying, or reviewing React components, page layouts, or stylesheets located in `app/` or `components/` for the receipt parsing pipeline.

## Operational Boundaries

- NEVER build marketing homepages, landing grids, admin dashboards, or unrelated billing screens; only the 3 Assessment 3 views are allowed (see `.agents/rules/design-system-rule.md`).
- NEVER hardcode raw `hsl()`/hex colors; ALWAYS use the generated CSS variables (`--color-*`, `--spacing-*`, `--radius-*`, `--typography-*`) defined in `matisse-tokens.css`.
- ALWAYS run client-side file validation (supported MIME types `image/jpeg`, `image/png`, `application/pdf`; size ≤10 MB) before requesting a presigned URL.
- NEVER add custom file-size, polling-interval, or timeout constants inline where they belong in a central config; keep client poll logic read-only.

---

## Step-by-Step Instructions

1. **Upload View** (`app/page.tsx`): Drag-and-drop dropzone accepting only the approved MIME types. Flow:
   - `POST /api/upload/presigned-url` → `{ uploadUrl, storageKey }`
   - `PUT` raw file payload to S3
   - `POST /api/jobs` → `{ jobId, status: "PENDING" }`
   - Redirect immediately to `/jobs/[id]`.

2. **Processing View** (`app/jobs/[id]/page.tsx` — PENDING/PROCESSING): poll `GET /api/jobs/[id]` every 2 seconds; 60-second client timeout transitions to a retry/error view; auto-transition to the DONE result view; render a friendly FAILED diagnostic state.

3. **Result View** (`app/jobs/[id]/page.tsx` — DONE): render extracted header details (merchant, date, total, currency, tax, category) and the line-items table (description, quantity, unit price, line total) with parsed values verbatim; "Summarize Expense" triggers `POST /api/jobs/[id]/summarize` and renders the cached summary in a drawer/modal; "Upload Another Receipt" routes back to `/`.

4. **Apply Design Tokens & Monospace Formatting:** Use CSS-variable-based Tailwind classes for all styling. Example primary action:

   ```tsx
   <button className="rounded-md bg-[var(--color-primary-color)] px-[var(--spacing-4)] py-[var(--spacing-2)] font-medium text-[var(--color-on-primary-color)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2">
     Summarize Expense
   </button>
   ```

   - Payment/amount columns must use `font-mono` (JetBrains Mono) with the parsed numeric values — no client-side currency conversion or re-formatting.