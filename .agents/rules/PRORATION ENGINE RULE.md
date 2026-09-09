---
trigger: glob
---

# PRORATION ENGINE RULE (.agents/rules/proration-engine.md)

## 1. Mathematical Order of Operations

- When calculating unused plan credits or prorated upgrade amounts, ALWAYS perform scalar multiplication BEFORE integer division.
- Formula: `UnusedCredit = Math.floor((CurrentPlanMinorUnits * DaysRemaining) / TotalDaysInPeriod)`
- NEVER compute a intermediate daily decimal rate prior to multiplication.

## 2. Net Upgrade Calculation Standard

- The net charge due for an immediate plan upgrade MUST be calculated as:
  `NetAmountDue = Math.max(0, NewPlanMinorUnits - UnusedCredit)`
- If `UnusedCredit >= NewPlanMinorUnits`, `NetAmountDue` MUST equal `0`.

## 3. Downgrade & Cancellation Lifecycles

- Mid-cycle plan downgrades MUST NOT issue immediate refunds or partial credits. Downgrades MUST be scheduled to take effect strictly at the end of the current billing period (`current_period_end`).
- Cancellation requests MUST set `cancel_at_period_end = true` on the user's `subscriptions` record and capture the optional `cancellation_reason`.
- Subscriptions MUST remain `active` until `current_period_end` is reached.
