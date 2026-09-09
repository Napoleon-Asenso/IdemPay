---
name: verify-webhook-signatures
description: Skill for extracting the raw request body in Next.js App Router route handlers and executing timing-safe HMAC-SHA256 signature comparison against a configured secret hash before any JSON parsing.
version: 1.0.0
---

# VERIFY WEBHOOK SIGNATURES SKILL

## Trigger Conditions

Activate this skill whenever building or reviewing webhook route handlers that verify an HMAC signature header against a shared secret before processing the payload.

## Operational Boundaries

- NEVER parse the request body as JSON using `req.json()` before signature verification completes.
- NEVER use standard equality operators (`===` or `==`) for cryptographic signature comparison.
- ALWAYS extract the raw request body with `await req.text()` so signing and verification operate on identical bytes.
- Return `401 Unauthorized` immediately when the header is missing or verification fails.

## Step-by-Step Instructions

1. **Extract the raw body and signature header.**
   ```typescript
   import { NextRequest, NextResponse } from "next/server";
   import crypto from "crypto";

   export async function POST(req: NextRequest) {
     const rawBody = await req.text();
     const signature = req.headers.get("verif-hash");
     const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

     if (!signature || !secretHash) {
       return NextResponse.json(
         { error: "Missing signature header or secret hash" },
         { status: 401 },
       );
     }

     const signatureBuffer = Buffer.from(signature);
     const secretBuffer = Buffer.from(secretHash);

     // Constant-time comparison: length check first, then timing-safe equal
     if (
       signatureBuffer.length !== secretBuffer.length ||
       !crypto.timingSafeEqual(signatureBuffer, secretBuffer)
     ) {
       return NextResponse.json(
         { error: "Invalid signature verification" },
         { status: 401 },
       );
     }

     const event = JSON.parse(rawBody);
     // ... continue processing only after verification
   }
   ```
2. **Verify the raw body BEFORE parsing:** compare the header against the secret with `crypto.timingSafeEqual`.
3. **Reject early:** return `401` on missing header/secret or any length/timing mismatch.
4. **Parse only after verification:** `JSON.parse(rawBody)` and proceed with idempotent transaction processing.