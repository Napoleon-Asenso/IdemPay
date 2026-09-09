# CODING STANDARD RULE (.agents/rules/coding-standard-rule.md)

## 1. TypeScript & Next.js Conventions

- All code is TypeScript (strict mode). Avoid `any`; validate every boundary input with Zod.
- Route handlers live under `app/api/**/route.ts` and export typed `GET`/`POST`/`PUT` handlers returning `NextResponse` with semantic status codes (`202 Accepted` for background offloading).
- NEVER log or expose secrets, API keys, or signed URLs. Read env vars via `process.env.*` only.

## 2. Validation & Error Handling

- Validate ALL external inputs (client payloads, AI output, S3 keys) at runtime with Zod. Shared schemas live in `src/config/ai.config.ts`.
- Strip unsafe framing (Markdown code fences) before passing raw AI output into schema parsing.
- Inspect `finish_reason`; if `!== "stop"`, throw an unretriable error (do not parse truncated output).
- Return clean, user-actionable error bodies on FAILED states (never raw stack traces).

## 3. Concurrency & Retry Discipline

- Enforce the central `AI_CONFIG.concurrencyLimit` (3) for background queue processing.
- Retry transient OpenAI 429/5xx with exponential backoff up to `AI_CONFIG.parsing.maxRetries` (2).
- NEVER retry unrecoverable failures (missing S3 object, invalid file type, corrupted image, truncated output) — mark the job FAILED immediately.

## 4. Configuration Hierarchy

- OpenAI parameters MUST live only in `src/config/ai.config.ts`. NEVER inline model/temperature/maxTokens values inside route handlers or worker code.

## 5. Financial Safety

- All billing/payment money is processed as integers in minor units per MONEY AND BILLING RULE. Never round, convert, or calculate on parsed document amounts; those are display-only values stored in `Job.resultJson`.

## 6. Webhook Signature Safety (if present)

- For webhook handlers, verify signatures against the RAW request body (`await req.text()`) using `crypto.timingSafeEqual` BEFORE any `JSON.parse`. See WEBHOOKS AND IDEMPOTENCY RULE.md.