---
trigger: glob
---

# WEBHOOKS AND IDEMPOTENCY RULE (.agents/rules/webhooks-and-idempotency.md)

## 1. Raw Body Verification

- The webhook route handler (`app/api/webhooks/flutterwave/route.ts`) MUST consume the raw request body as plain text using `await req.text()`.
- NEVER use `req.json()` prior to HMAC signature verification.

## 2. Cryptographic Signature Validation

- Extract the verification header (`verif-hash`) and compare it against `process.env.FLUTTERWAVE_SECRET_HASH`.
- Verification MUST use constant-time comparison via `crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(secret))`.
- Return `401 Unauthorized` immediately if signature validation fails or headers are missing.

## 3. Database Idempotency & Transaction Locks

- Webhook processing MUST be executed inside an atomic database transaction (`prisma.$transaction`).
- BEFORE updating subscription state, insert an entry into `payment_logs` with `provider_event_id` set to the gateway event ID and `amount_in_minor_units` taken as an integer from the gateway payload. NEVER round or multiply floats to derive amounts.
- Catch Prisma duplicate entry errors (`P2002`). If `provider_event_id` already exists, abort processing immediately and return a `200 OK` response with message `"Event already processed"`.
