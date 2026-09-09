---
name: manage-subscription-lifecycles
description: Skill for managing plan status transitions, period-end cancellations with retained access, reason capture, and status polling logic for zero-trust return views.
version: 1.0.0
---

# MANAGE SUBSCRIPTION LIFECYCLES SKILL

## Trigger Conditions

Activate this skill when building subscription cancellation routes (`app/api/subscription/cancel/route.ts`), return view polling (`app/checkout/return/page.tsx`), or status API routes (`app/api/subscription/status/route.ts`).

## Operational Boundaries

- NEVER delete subscription records upon cancellation.
- NEVER revoke access immediately upon cancellation prior to `current_period_end`.
- NEVER trust URL query parameters on return redirects to update subscription states.

## Step-by-Step Instructions

1. **Handle Period-End Cancellation Requests:**

   ```typescript
   export async function POST(req: NextRequest) {
     const { userId, reason } = await req.json();

     const subscription = await prisma.subscriptions.update({
       where: { user_id: userId },
       data: {
         cancel_at_period_end: true,
         cancellation_reason: reason || null,
       },
     });

     return NextResponse.json({ subscription }, { status: 200 });
   }
   ```

2. **Implement Read-Only Polling for Return Views:** On checkout return views (`app/checkout/return/page.tsx`), poll `/api/subscription/status` to confirm entitlement provisioning state without triggering state updates from client parameters.