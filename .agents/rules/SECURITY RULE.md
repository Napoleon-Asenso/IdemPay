# SECURITY RULE (.agents/rules/security.md)

## 1. Zero-Trust Redirect Handling
* NEVER update database user state, upgrade plans, or grant subscription access based on client redirects or URL query params (e.g., `/checkout/return?status=successful&tx_ref=123`).
* Return pages MUST act as read-only status viewers that poll `/api/subscription/status` to check real backend entitlement state.

## 2. Entitlement Provisioning Boundary
* Subscription state changes and plan grants MUST occur strictly server-to-server via verified webhooks inside `app/api/webhooks/flutterwave/route.ts`.

## 3. PCI Compliance & Card Data Capture
* NEVER render custom card input fields (`<input name="cardnumber">`), CVV forms, or card processing scripts inside the application.
* ALL payment collection MUST occur via redirection to Flutterwave's secure hosted payment gateway URL.

## 4. Rate Limiting & Auth Guards
* All public POST endpoints (`/api/checkout/initiate`, `/api/subscription/cancel`) MUST enforce session validation and basic rate limiting to prevent automated spam and resource exhaustion.