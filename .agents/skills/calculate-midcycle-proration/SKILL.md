---
name: calculate-midcycle-proration
description: Skill for implementing exact whole-cent integer proration calculations with zero floating-point arithmetic during mid-cycle plan upgrades.
version: 1.0.0
---

# CALCULATE MIDCYCLE PRORATION SKILL

## Trigger Conditions

Activate this skill whenever editing `lib/proration.ts`, plan pricing logic, or upgrade payment calculation routes.

## Operational Boundaries

- NEVER use `parseFloat()`, double precision floats, or standard decimal division for monetary calculations.
- ALWAYS store and compute values as positive integers in minor units (cents/pesewas).
- ALWAYS perform scalar multiplication BEFORE integer division.

## Step-by-Step Instructions

1. **Implement Scalar Integer Proration:**

   ```typescript
   /**
    * Calculates net charge for mid-cycle upgrades using integer floor math.
    * ALL values are in minor units (cents). Floating point arithmetic is strictly forbidden.
    */
   export function calculateUpgradeProration(
     currentPlanMinorUnits: number,
     newPlanMinorUnits: number,
     daysRemaining: number,
     totalDaysInPeriod: number
   ): { unusedCredit: number; netAmountDue: number } {
     // Perform scalar multiplication prior to integer division
     const unusedCredit = Math.floor(
       (currentPlanMinorUnits * daysRemaining) / totalDaysInPeriod
     );
     const netAmountDue = Math.max(0, newPlanMinorUnits - unusedCredit);

     return { unusedCredit, netAmountDue };
   }
   ```

2. **Verify Calculation Precision:** Ensure test cases pass with exact integer arithmetic: $20.00 current plan (2000 cents), 20 days remaining out of 30 days: $\lfloor (2000 \times 20) / 30 \rfloor = \lfloor 40000 / 30 \rfloor = 1333$ cents unused credit.