---
name: enforce-webhook-idempotency
description: Skill for constructing atomic Prisma database transactions that enforce unique constraints on payment_logs.provider_event_id to guarantee single-execution processing for retried webhook payloads.
version: 1.0.0
---

# ENFORCE WEBHOOK IDEMPOTENCY SKILL

## Trigger Conditions

Activate this skill whenever constructing, editing, or reviewing payment webhook event handlers, log persistence, or entitlement update routes in `app/api/webhooks/`.

## Operational Boundaries

- NEVER process webhook payment logs or entitlement updates outside an atomic transaction (`prisma.$transaction`).
- NEVER throw unhandled errors or return HTTP 500 status codes on duplicate event retries; return HTTP 200 OK with an explicit idempotent skip payload.
- ALWAYS treat `payment_logs.provider_event_id` as the primary unique constraint for deduplication.

---

## Step-by-Step Instructions

1. **Wrap Event Handling in Atomic Transactions:**
   Execute payment log insertion and subscription state transitions within a single `prisma.$transaction()` block to guarantee all-or-nothing execution.

2. **Handle Duplicate Event Ingestion Idempotently:**
   Catch Prisma's unique constraint violation code (`P2002`) on `provider_event_id` and exit gracefully with an HTTP 200 OK status.

3. **Implement Idempotent Event Processing:**

   ```typescript
   import { NextRequest, NextResponse } from "next/server";
   import { prisma } from "@/lib/prisma";

   export async function processWebhookEvent(event: any) {
     const providerEventId = String(event.data.id);

     try {
       await prisma.$transaction(async (tx) => {
// 1. Attempt to create the payment log record
          // Monetary value MUST be an integer in minor units from the gateway
          // payload; rounding floats is strictly forbidden.
          await tx.payment_logs.create({
            data: {
              provider_event_id: providerEventId,
              user_id: event.data.meta.user_id,
              event_type: event.event,
              amount_in_minor_units: event.data.amount_in_minor_units,
              currency: event.data.currency || "USD",
              payload_json: event,
            },
          });

         // 2. Perform entitlement provisioning inside the same transaction
         if (
           event.event === "charge.completed" &&
           event.data.status === "successful"
         ) {
           const interval =
             (event.data.meta.plan_interval as "monthly" | "yearly") ||
             "monthly";
           const durationDays = interval === "yearly" ? 365 : 30;

           await tx.subscriptions.upsert({
             where: { user_id: event.data.meta.user_id },
             update: {
               plan_interval: interval,
               status: "active",
               current_period_start: new Date(),
               current_period_end: new Date(
                 Date.now() + durationDays * 24 * 60 * 60 * 1000,
               ),
               cancel_at_period_end: false,
             },
             create: {
               user_id: event.data.meta.user_id,
               provider_subscription_id: String(
                 event.data.subscription_id || providerEventId,
               ),
               plan_interval: interval,
               status: "active",
               current_period_start: new Date(),
               current_period_end: new Date(
                 Date.now() + durationDays * 24 * 60 * 60 * 1000,
               ),
             },
           });
         }
       });

       return NextResponse.json({ status: "success" }, { status: 200 });
     } catch (error: any) {
       // Catch Prisma unique key collision on provider_event_id
       if (error.code === "P2002") {
         return NextResponse.json(
           { message: "Event already processed" },
           { status: 200 },
         );
       }

       return NextResponse.json(
         { error: "Transaction processing failed" },
         { status: 500 },
       );
     }
   }
   ```
