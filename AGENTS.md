# AGENTS.md — Workspace Guidance & Architectural Laws

This document governs the operational rules, core architectural constraints, and execution workflow for AI coding agents working on **IdemPay** (Assessment 2: Payment and Subscription Slice).

---

## 1. Core Operating Philosophy

1. **Determinism Over Ingenuity:** Strictly implement specifications as written in `PRD.md` and active `.agents/rules/` files. Never invent features, introduce unscheduled UI routes, or add extra dependency packages.
2. **Zero-Trust Security:** Never trust client-side parameters, state indicators, or URL parameters for entitlement updates. All billing state mutations must originate strictly from verified server-to-server webhook events.
3. **Financial Precision:** Currency must be represented as minor unit integers (cents/pesewas). Floating-point arithmetic (`number` division/multiplication) for price calculations is strictly forbidden.
4. **Scope Isolation:** Build strictly across the 5 essential UI views. Do not construct marketing homepages, custom credit card input forms, or external landing pages.

---

## 2. Locked Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Actions, Route Handlers)
- **Language:** TypeScript (Strict Mode enabled)
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS + Theme Design Tokens
- **Payment Gateway:** Flutterwave Hosted Checkout & Webhooks

---

## 3. Directory & Folder Conventions

All scaffolded code must strictly align with the following layout:

```text
.
├── .agents/
│   ├── rules/                 # System laws (Always On & Glob Triggered)
│   └── skills/                # Modular operational domain skills
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── initiate/
│   │   │       └── route.ts   # Checkout handoff initiation
│   │   ├── subscription/
│   │   │   ├── cancel/
│   │   │   │   └── route.ts   # Period-end cancellation endpoint
│   │   │   └── status/
│   │   │       └── route.ts   # Read-only polling for entitlements
│   │   └── webhooks/
│   │       └── flutterwave/
│   │           └── route.ts   # Raw body HMAC verification & idempotency
│   ├── billing/
│   │   └── page.tsx           # Billing dashboard & payment log history
│   ├── checkout/
│   │   ├── handoff/
│   │   │   └── page.tsx       # Transition loader before hosted gateway
│   │   └── return/
│   │       └── page.tsx       # Client return view with read-only polling
│   ├── plans/
│   │   └── page.tsx           # Monthly/Yearly toggle & proration callouts
│   ├── layout.tsx             # Signed-in shell navigation layout
│   └── page.tsx               # Root redirect to /plans or /billing
├── components/
│   ├── CancellationModal.tsx  # Cancellation reason modal
│   ├── NavigationBar.tsx      # Top shell navigation bar
│   └── ProrationCallout.tsx   # Upgrade proration calculation view
├── lib/
│   ├── logger.ts              # Structured logger
│   ├── prisma.ts              # PrismaClient singleton
│   └── proration.ts           # Integer floor proration math engine
├── prisma/
│   └── schema.prisma          # PostgreSQL canonical database schema
├── types/
│   └── index.ts               # Shared TypeScript types & interfaces
├── AGENTS.md                  # Workspace execution guidelines
└── PRD.md                     # Payment & Subscription Slice PRD
```
