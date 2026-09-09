# MONEY AND BILLING RULE (.agents/rules/money-and-billing.md)

## 0. Scope

- This rule governs ALL monetary values that enter billing/payment state: checkout, proration, `subscriptions`, and `payment_logs`. It is the governing standard wherever money is stored, calculated, or displayed in billing flows.
- The Assessment 3 parsing slice stores raw extracted document values in `Job.resultJson` (floats per `ParsedReceiptSchema`) for DISPLAY ONLY. These are uncalculated source values and are NEVER used in financial computations and MUST NEVER be rounded, converted, or written into billing tables.

## 1. Absolute Integer Minor Unit Standard
* ALL monetary amounts in the database, API payloads, proration logic, and state management MUST be stored and processed strictly as positive integers in minor units (e.g., cents or pesewas: $10.00 = `1000`).
* NEVER use floating-point types (`float`, `double`, `DECIMAL` with fractional components) or standard JavaScript `Number` division for financial calculations.

## 2. Zero Floating-Point Arithmetic Rule
* NEVER use `parseFloat()`, `Math.round()` on raw dollar floats, or direct division `/ 100` during backend processing or database operations.
* EVERY monetary transformation MUST use strict integer scalar multiplication or `Math.floor()` on whole minor units.

## 3. Currency System Locks
* The system currency is strictly locked to `USD` (`SYSTEM_CURRENCY=USD`).
* Custom dynamic multi-currency conversions, client-side FX rate lookup APIs, or dynamic currency switching logic are STRICTLY FORBIDDEN.

## 4. Frontend Display Formatting
* Conversion from minor units (cents) to major units ($ display) MUST occur ONLY at the final presentation layer using `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` divided by integer 100.