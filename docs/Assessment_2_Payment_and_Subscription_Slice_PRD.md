Assessment 2: Payment & Subscription Slice
Product Requirements Document (PRD) 
AUDITED & PRODUCTION-READY
AUTHOR / PM
Principal PM & Tech Architect
TARGET STACK
Next.js (App Router), Prisma, Postgres
GATEWAY
Flutterwave (Test Mode)
VERSION / STATUS
v1.1.0 (Post-Audit Approved)
1. Product Summary
The Payment and Subscription Slice is a self-contained, production-grade billing infrastructure for SaaS applications
operating within a Product Engineering Bootcamp environment. It provides complete subscription lifecycle management
including checkout handoff, webhook-driven entitlement provisioning, mid-cycle upgrades with mathematically exact
whole-minor-unit proration, scheduled downgrades, and period-end cancellations with feedback tracking. 
The system explicitly integrates with Flutterwave while maintaining strict architectural boundaries: zero client-side trust,
integer-only  currency  storage  in  minor  units  (cents/pesewas),  timing-safe  HMAC-SHA256  signature  verification,
idempotent transactional event processing, and isolation from marketing or dashboard features. 
2. Problem Statement & Architectural Audit Mandates
SaaS applications frequently suffer from critical revenue leakages, security vulnerabilities, and state corruption due to
poor payment integration design. This PRD eliminates the following specific anti-patterns: 
Client-Side Entitlement Granting: Granting subscriptions based on frontend redirects or unverified client query
parameters.
Floating-Point Currency Drift: Using standard float arithmetic for financial calculations leading to rounding
mismatches.
Race Conditions & Duplicate Webhooks: Webhook retries triggering duplicate subscription grants or invalid logs.
Inaccurate Mid-Cycle Adjustments: Intermediate daily rate flooring during upgrades/downgrades causing credit
loss.
Locked Architectural Audit Directives
Zero Floating-Point Operations: All API endpoints and internal logic must process monetary values exclusively as
positive integers in minor units. Codebases are strictly forbidden from using parseFloat(), Math.round(), or floating-
point operations during currency calculations.
Server Verification Step: Webhook processing must execute a mandatory server-to-server transaction verification
query (GET /v3/transactions/{id}/verify) prior to DB state mutation.
Single Currency Configuration: The application enforces a single system-wide currency code
(SYSTEM_CURRENCY=USD) configured via environment variables. Dynamic multi-currency switching is strictly prohibited.
3. Goals and Non-Goals
3.1 Primary Goals
Zero-Trust State Transitions: Entitlements are granted exclusively via cryptographically verified, timing-safe server-
side webhooks.
Financial Precision: All monetary values stored and calculated strictly as positive integers in minor units.
• 
• 
• 
• 
• 
• 
• 
• 
• 
CONFIDENTIAL - Assessment 2: Payment & Subscription Slice PRD
Page 1 of 8


Strict Idempotency: Every incoming payment gateway event is processed exactly once using database-level unique
constraints on provider_event_id inside atomic Prisma transactions.
Exact Proration Engine: Implement mid-cycle upgrade proration using scalar multiplication prior to division to ensure
zero float loss.
3.2 Non-Goals ("Strict Do Not Build" Boundary)
Strict Do Not Build Scope Boundary
Building any of the following items will result in an immediate architectural audit failure:
NO Marketing Pages / Landing Pages: No marketing copy, feature comparison grids beyond billing, or public
homepages.
NO Paywalled Application Dashboards: No functional SaaS products, analytical tools, or core application features
beyond subscription access control screens.
NO Custom Card Input Elements (PCI Violations): Zero credit card inputs, raw card tokenizers, or custom form
fields for PAN/CVV handling. All payment capture must occur via Flutterwave-hosted interface.
NO Direct Invoice PDF Generation Engine: No automated PDF rendering or emailing of tax receipts.
NO Multi-Currency Live Conversion Rates: All transactions operate in a single static currency unit (USD) without
live FX integrations or dynamic checkout currency switching.
4. User Personas & Core User Journeys
4.1 User Personas
Persona
Role
Primary Objective
Key Pain Point
Free Tier User
Unsubscribed
Member
Explore paid plans and upgrade
seamlessly with transparent pricing.
Fears immediate unexpected charges or
failed payment loops.
Active
Subscriber
Paying Customer
Manage plan intervals, upgrade
immediately, or schedule cancellation.
Losing paid days during mid-cycle plan
changes without proper credit.
Billing
Engineer
System Operator /
Auditor
Inspect audit logs, verify webhook
signatures, and debug payment states.
Silent webhook failures or corrupted
subscription status logs.
4.2 Core User Journeys
Journey A: New Subscription Acquisition (Free → Monthly/Yearly)
User logs in and navigates to the /plans screen within the signed-in shell.
User clicks "Subscribe" on the Monthly ($20.00 / 2000 cents) or Yearly ($200.00 / 20000 cents) plan.
System issues a rate-limited POST /api/checkout/initiate request, creates a pending payment_logs record with
event type checkout_initiated using a generated tx_ref, and receives a Hosted Flutterwave Checkout URL.
User is redirected to the Flutterwave Hosted Payment Page and enters payment details.
Upon payment completion, Flutterwave redirects user to /checkout/return?tx_ref={tx_ref}.
The Return View renders a poll-based loading state while waiting for background processing.
Flutterwave server transmits a charge.completed webhook to /api/webhooks/flutterwave.
Server verifies HMAC-SHA256 signature, validates payload, executes atomic DB transaction, records payment_logs
row, and updates subscriptions table.
Return View polling detects active plan and renders success UI with "Go to Billing".
• 
• 
• 
• 
• 
• 
• 
1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
9. 
CONFIDENTIAL - Assessment 2: Payment & Subscription Slice PRD
Page 2 of 8


Journey B: Immediate Mid-Cycle Plan Upgrade (Monthly → Yearly)
Active Monthly subscriber views /plans or /billing.
User selects "Upgrade to Yearly".
System calculates exact mid-cycle proration using the exact whole-minor-unit scalar algorithm.
System initiates payment checkout for the net proration amount due.
Webhook receives successful payment event and updates subscription interval to Yearly, extending 
current_period_end by 1 full calendar year from the current period end date (or resetting from current timestamp if
expired).
Journey C: Subscription Cancellation (Retained Access)
Active subscriber clicks "Cancel Subscription" on /billing.
Modal requests optional feedback reason ("Too Expensive", "Missing Features", "Other").
User confirms cancellation via POST /api/subscription/cancel.
System updates subscriptions.cancellation_reason and sets cancel_at_period_end = true.
User retains full access until current_period_end, at which point background engine transitions status to Free.
5. Functional Requirements (The 5 Essential UI Views)
The system is strictly structured around 5 essential UI views within the Signed-in Shell, supported by background
automation services: 
Signed-in Shell (/layout.tsx): Wraps all 4 billing views with consistent navigation: User Profile, Active Plan Badge,
Navigation Links (Plans, Billing). Renders dynamic status banner if cancel_at_period_end = true displaying: "Your
subscription will end on [Date]. Click to Reactivate."
Plans View (/plans): Renders Monthly ($20.00/mo) and Yearly ($200.00/yr) options. Highlights current plan with an
active badge and disables checkout for active tier. Shows mid-cycle proration breakdown callout if an active Monthly
subscriber selects Yearly plan.
Checkout Handoff View (/checkout/handoff): Intermediate transition state when initiating payment redirect.
Prevents double-clicks by disabling inputs and displaying: "Redirecting to Flutterwave Secure Checkout..." Auto-
submits within 1.5 seconds.
Return View (/checkout/return): Destination URL post-checkout. Must NOT grant entitlement directly upon
rendering. Executes status check against GET /api/subscription/status every 2 seconds (up to 15 attempts / 30s).
Upon 15 timeouts, renders a "Verification In Progress" state with a manual "Check Again" button and blocks new
checkout initiations while tx_ref is active.
Billing View (/billing): Displays active subscription metadata (Plan Tier, Status, Current Period Start/End, Renewal/
Expiry Date). Provides controls for Upgrade/Downgrade, Cancel Subscription, and Transaction History Table sourced
directly from payment_logs.
6. Technical Requirements & API Specifications
6.1 API Endpoints Specification
Endpoint Route
Method
Auth
Description & Guardrails
/api/checkout/
initiate
POST
Session Auth
Initiates payment checkout. Rate limited (3 req/min/user). Writes initiation
log to DB.
POST
1. 
2. 
3. 
4. 
5. 
1. 
2. 
3. 
4. 
5. 
1. 
2. 
3. 
4. 
5. 
CONFIDENTIAL - Assessment 2: Payment & Subscription Slice PRD
Page 3 of 8


Endpoint Route
Method
Auth
Description & Guardrails
/api/webhooks/
flutterwave
HMAC
Signature
Raw body HMAC-SHA256 signature verifier. Grants entitlements
idempotently within atomic DB transactions.
/api/subscription/
cancel
POST
Session Auth
Sets cancel_at_period_end = true and saves feedback reason
string.
/api/subscription/
status
GET
Session Auth
Polled by Return View to verify if subscription processing has completed.
6.2 Production Webhook Route Handler Implementation
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("verif-hash");
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!signature || !secretHash) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 401 });
  }
  // Timing-safe secret verification
  const signatureBuffer = Buffer.from(signature);
  const secretBuffer = Buffer.from(secretHash);
  if (
    signatureBuffer.length !== secretBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, secretBuffer)
  ) {
    return NextResponse.json({ error: "Invalid signature verification" }, { status: 401 });
  }
  const event = JSON.parse(rawBody);
  const providerEventId = String(event.data.id);
  try {
    // Atomic Idempotency Check & Transaction Processing
    await prisma.$transaction(async (tx) => {
      // 1. Insert Payment Log (Unique constraint on provider_event_id prevents concurrent races)
      await tx.payment_logs.create({
        data: {
          provider_event_id: providerEventId,
          user_id: event.data.meta.user_id,
          event_type: event.event,
          amount_in_minor_units: event.data.amount_in_minor_units,
          currency: event.data.currency,
          payload_json: event,
        },
      });
      // 2. Grant Entitlement
      if (event.event === "charge.completed" && event.data.status === "successful") {
        await tx.subscriptions.upsert({
          where: { user_id: event.data.meta.user_id },
          update: {
CONFIDENTIAL - Assessment 2: Payment & Subscription Slice PRD
Page 4 of 8


            plan_interval: event.data.meta.plan_interval,
            status: "active",
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          create: {
            user_id: event.data.meta.user_id,
            provider_subscription_id: String(event.data.subscription_id || providerEventId),
            plan_interval: event.data.meta.plan_interval,
            status: "active",
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }
    });
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    if (error.code === "P2002") { // Prisma Unique Constraint Collision
      return NextResponse.json({ message: "Event already processed" }, { status: 200 });
    }
    return NextResponse.json({ error: "Transaction processing failed" }, { status: 500 });
  }
}
7. Corrected Production Prisma Data Model
Normalized  PostgreSQL  schema  configuration  enforcing  strict  1-to-1  subscriber  relationships  and  database-level
idempotency constraints: 
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
enum PlanInterval {
  monthly
  yearly
}
enum SubscriptionStatus {
  active
  canceled
  past_due
  unpaid
  incomplete
}
model users {
  id           String         @id @default(uuid())
  email        String         @unique
  created_at   DateTime       @default(now())
  updated_at   DateTime       @updatedAt
  subscription subscriptions?
CONFIDENTIAL - Assessment 2: Payment & Subscription Slice PRD
Page 5 of 8


  payment_logs payment_logs[]
  @@index([email])
}
model subscriptions {
  id                       String             @id @default(uuid())
  user_id                  String             @unique
  provider_subscription_id String             @unique
  plan_interval            PlanInterval
  status                   SubscriptionStatus
  current_period_start     DateTime
  current_period_end       DateTime
  cancel_at_period_end     Boolean            @default(false)
  cancellation_reason      String?            @db.VarChar(500)
  created_at               DateTime           @default(now())
  updated_at               DateTime           @updatedAt
  user                     users              @relation(fields: [user_id], references: [id], 
onDelete: Cascade)
  @@index([status])
}
model payment_logs {
  id                    String   @id @default(uuid())
  user_id               String
  provider_event_id     String   @unique
  event_type            String
  amount_in_minor_units Int
  currency              String   @default("USD")
  payload_json          Json
  created_at            DateTime @default(now())
  user                  users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@index([user_id])
  @@index([event_type])
}
8. Business Model & Exact Proration Logic
8.1 Mid-Cycle Proration Calculation Engine
When an active Monthly subscriber upgrades to Yearly mid-cycle, unused days from the current period are credited
toward the new plan. Scalar multiplication precedes integer division to eliminate premature flooring loss. 
Exact Whole-Minor-Unit Proration Formulas
Unused Credit = Floor((Current Plan Minor Units * Days Remaining) / Total Days in Period)
Net Amount Due = Max(0, New Plan Minor Units - Unused Credit)
Worked Example (Corrected Whole-Minor-Unit Execution):
Current Plan: Monthly ($20.00 / 2000 cents). Billing Period = 30 Days.
Upgrade Triggered: Day 10 (20 days remaining).
Unused Credit Calculation: Floor((2000 * 20) / 30) = Floor(40000 / 30) = Floor(1333.33) = 1333 cents
($13.33 USD).
• 
• 
• 
CONFIDENTIAL - Assessment 2: Payment & Subscription Slice PRD
Page 6 of 8


New Plan Price: Yearly ($200.00 / 20000 cents).
Net Immediate Charge Due: 20000 - 1333 = 18667 cents ($186.67 USD).
9. Risk Management & Mitigation Matrix
Risk Category
Impact
Level
Architectural Mitigation Strategy
Duplicate Webhook
Delivery
High
Unique database constraint on payment_logs.provider_event_id wrapped inside an
atomic Prisma transaction catching P2002 errors.
Out-of-Order
Webhooks
Medium
Enforce strict state machine guardrails. Reject transitions from active/canceled back to
pending unless backed by a fresh validated charge.completed event.
Checkout
Abandonment
Low
Log initiation events with status checkout_initiated. Expire orphaned initiation records
older than 24 hours.
Frontend Spoofing
Critical
Return View relies strictly on server API state polling. Access is granted exclusively when
database state verifies webhook processing completion.
10. Key Success Metrics & Evidence Collection
10.1 Key Success Metrics
Webhook Processing Latency: < 500ms from reception to database commit.
Zero Double-Grant Rate: 0 duplicate subscription records across 100% simulated retry test runs.
Proration Math Precision: 100% compliance with zero float drift across test scenarios.
10.2 Evidence Collection Artifacts (Bootcamp Verification)
Flutterwave Webhook Simulator / ngrok Log Screenshot: Terminal output showing 200 OK responses to verified 
verif-hash payloads.
PostgreSQL Shell Query Output: Database query verifying atomic rows in payment_logs and single corresponding
state updates in subscriptions.
Return View Polling Capture: Chrome Network tab capture showing sequence of GET /api/subscription/status
calls transitioning from pending to active.
11. Stated System Assumptions
[ASSUMPTION] System Currency Standard: System currency is locked to USD ($) mapped to minor integer units
(cents) via SYSTEM_CURRENCY=USD.
[ASSUMPTION] Leap Year Handling: Yearly billing periods are fixed at 365 standard days for daily rate proration
calculations.
[ASSUMPTION] Grace Period Rule: Payment failures transition subscription status to past_due with a 3-day grace
period before downgrade to free.
12. Phased Implementation Roadmap
Phase
Focus Area
Core Deliverables
Phase
1
Data Model & Core
Shell
Execute corrected Prisma schema migration, build signed-in shell layout and navigation bar.
• 
• 
• 
• 
• 
1. 
2. 
3. 
• 
• 
• 
CONFIDENTIAL - Assessment 2: Payment & Subscription Slice PRD
Page 7 of 8


Phase
Focus Area
Core Deliverables
Phase
2
Checkout &
Webhooks
Implement POST /api/checkout/initiate, timing-safe HMAC webhook handler, and
atomic Prisma transaction pipeline.
Phase
3
Return View &
Polling
Build Return View UI with dynamic status polling and timeout verification handling.
Phase
4
Proration &
Cancellation
Build exact whole-minor-unit proration engine, cancellation modal, and billing history UI.
CONFIDENTIAL - Assessment 2: Payment & Subscription Slice PRD
Page 8 of 8
