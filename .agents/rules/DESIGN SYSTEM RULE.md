---
trigger: glob
---

# DESIGN SYSTEM RULE (.agents/rules/design-system-rule.md)

## 1. Scope Boundary (Assessment 3 Views Only)

The codebase MUST contain ONLY the following receipt-parsing views. Building unauthorized landing pages, marketing grids, admin dashboards, or unrelated billing/management screens is STRICTLY FORBIDDEN:

1. **Upload View** (`app/page.tsx`): Drag-and-drop dropzone for `image/jpeg`, `image/png`, `application/pdf`; client-side validation (file types + size ≤10 MB); presigned-URL → S3 PUT → `/api/jobs` flow; redirect to `/jobs/[id]`.
2. **Processing View** (`app/jobs/[id]/page.tsx` — PENDING/PROCESSING): 2-second polling of `GET /api/jobs/[id]`, 60-second client timeout with retry UI, automatic transition on state change, friendly FAILED diagnostic state.
3. **Result View** (`app/jobs/[id]/page.tsx` — DONE): header details (merchant, date, total, currency, tax, category), line-items table (description, quantity, unit price, line total), "Summarize Expense" action with drawer/modal, and "Upload Another Receipt" reset route.

## 2. Strict Theme Token Mapping (CSS Variables)

Design tokens are generated to `matisse-tokens.css` via `matisse-tokens-to-css.js`. ALWAYS reference tokens through their CSS variables using Tailwind arbitrary values. NEVER hardcode raw `hsl()`/hex values in components:

```tsx
<button className="rounded-md bg-[var(--color-primary-color)] px-[var(--spacing-4)] py-[var(--spacing-2)] font-medium text-[var(--color-on-primary-color)]">
  Summarize Expense
</button>
```

### Color System Rules

- **Primary Actions:** `bg-[var(--color-primary-color)]` with `text-[var(--color-on-primary-color)]`.
- **Surfaces:** `bg-[var(--color-surface-color)]` with `text-[var(--color-on-surface-color)]`; use container tokens (`--color-surface-container-lowest-color` … `--color-surface-container-highest-color`) for cards/tables. Dark mode is handled by the `[data-theme="dark"]` / `prefers-color-scheme` blocks in `matisse-tokens.css`.
- **Status Indicators:** PENDING/PROCESSING use `--color-secondary-container-color` / `--color-tertiary-container-color`; DONE uses `--color-primary-container-color`; FAILED uses `--color-error-container-color` and `--color-on-error-container-color`.
- **Outlines/Borders:** `--color-outline-variant-color` and `--color-outline-color`.

### Typography Rules

- Font Families: Sans/Display -> `var(--typography-font-family-sans)` (`Inter`); Monospace -> `var(--typography-font-family-mono)` (`JetBrains Mono`) for currency values, line-item totals, and parsed amounts.
- Scale: `--typography-font-size-sm`/`--typography-font-size-base` for body, `--typography-font-size-xl`–`--typography-font-size-3xl` for headers, as defined in design tokens.

### Layout & Component Standards

- Spacing MUST strictly use scale tokens: `var(--spacing-1)` through `var(--spacing-96)`.
- Border Radius MUST follow token rules: `var(--radius-md)` (= 0.375rem), `var(--radius-lg)` (= 0.5rem), `var(--radius-full)` (= 9999px).
- Line-item monetary columns MUST use the monospace font and the parsed numeric values — no client-side currency conversion or re-formatting of source amounts.