/**
 * Calculates net charge for mid-cycle upgrades using strict integer floor math.
 * ALL values are in minor units (cents). Floating-point arithmetic is strictly forbidden.
 *
 * Formula:
 * UnusedCredit = Math.floor((CurrentPlanMinorUnits * DaysRemaining) / TotalDaysInPeriod)
 * NetAmountDue = Math.max(0, NewPlanMinorUnits - UnusedCredit)
 */
export function calculateUpgradeProration(
  currentPlanMinorUnits: number,
  newPlanMinorUnits: number,
  daysRemaining: number,
  totalDaysInPeriod: number
): { unusedCredit: number; netAmountDue: number } {
  if (totalDaysInPeriod <= 0) {
    throw new Error("totalDaysInPeriod must be a positive integer greater than zero.");
  }
  if (daysRemaining < 0) {
    throw new Error("daysRemaining cannot be negative.");
  }
  if (currentPlanMinorUnits < 0 || newPlanMinorUnits < 0) {
    throw new Error("Plan values in minor units must be non-negative integers.");
  }

  // Ensure whole integer calculations: cap days remaining at totalDaysInPeriod
  const effectiveDaysRemaining = Math.min(daysRemaining, totalDaysInPeriod);

  // Perform scalar multiplication PRIOR to integer division
  const unusedCredit = Math.floor(
    (currentPlanMinorUnits * effectiveDaysRemaining) / totalDaysInPeriod
  );

  const netAmountDue = Math.max(0, newPlanMinorUnits - unusedCredit);

  return { unusedCredit, netAmountDue };
}

/**
 * Formats a minor-unit integer (cents) into a major currency display string ($XX.XX).
 * Conversion MUST occur ONLY at the presentation layer using Intl.NumberFormat.
 */
export function formatCurrencyFromMinorUnits(
  minorUnits: number,
  currency: string = "USD"
): string {
  const majorUnits = minorUnits / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(majorUnits);
}
