import { calculateUpgradeProration } from "../lib/proration";

function runTests() {
  console.log("Running Proration Engine Precision Tests...\n");

  // Test 1: PRD Worked Example
  // Current Plan: Monthly ($20.00 / 2000 cents), Total Days = 30.
  // Day 10 upgrade -> 20 days remaining.
  // Unused Credit = Floor((2000 * 20) / 30) = Floor(40000 / 30) = 1333 cents ($13.33)
  // New Plan: Yearly ($200.00 / 20000 cents).
  // Net Due = 20000 - 1333 = 18667 cents ($186.67)
  const test1 = calculateUpgradeProration(2000, 20000, 20, 30);
  console.log("Test 1 (PRD Worked Example - Day 10 of 30):", test1);
  if (test1.unusedCredit !== 1333 || test1.netAmountDue !== 18667) {
    throw new Error(`Test 1 Failed: Expected { unusedCredit: 1333, netAmountDue: 18667 }, got ${JSON.stringify(test1)}`);
  }

  // Test 2: Full cycle remaining (Day 0 upgrade)
  // 30 days remaining out of 30 days.
  // Unused Credit = Floor((2000 * 30) / 30) = 2000 cents.
  // Net Due = 20000 - 2000 = 18000 cents.
  const test2 = calculateUpgradeProration(2000, 20000, 30, 30);
  console.log("Test 2 (Day 0 Upgrade):", test2);
  if (test2.unusedCredit !== 2000 || test2.netAmountDue !== 18000) {
    throw new Error(`Test 2 Failed: Expected { unusedCredit: 2000, netAmountDue: 18000 }, got ${JSON.stringify(test2)}`);
  }

  // Test 3: Last day of cycle (0 days remaining)
  // Unused Credit = Floor((2000 * 0) / 30) = 0.
  // Net Due = 20000 - 0 = 20000 cents.
  const test3 = calculateUpgradeProration(2000, 20000, 0, 30);
  console.log("Test 3 (0 days remaining):", test3);
  if (test3.unusedCredit !== 0 || test3.netAmountDue !== 20000) {
    throw new Error(`Test 3 Failed: Expected { unusedCredit: 0, netAmountDue: 20000 }, got ${JSON.stringify(test3)}`);
  }

  // Test 4: Intermediate rounding check (1 day remaining)
  // Floor((2000 * 1) / 30) = Floor(66.666...) = 66 cents.
  // Net Due = 20000 - 66 = 19934 cents.
  const test4 = calculateUpgradeProration(2000, 20000, 1, 30);
  console.log("Test 4 (1 day remaining):", test4);
  if (test4.unusedCredit !== 66 || test4.netAmountDue !== 19934) {
    throw new Error(`Test 4 Failed: Expected { unusedCredit: 66, netAmountDue: 19934 }, got ${JSON.stringify(test4)}`);
  }

  console.log("\nALL PRORATION TESTS PASSED WITH 100% INTEGER PRECISION!");
}

runTests();
