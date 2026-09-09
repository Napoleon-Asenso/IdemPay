export type PlanInterval = "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "incomplete";

export interface User {
  id: string;
  email: string;
  created_at: Date | string;
  updated_at: Date | string;
  subscription?: Subscription | null;
  payment_logs?: PaymentLog[];
}

export interface Subscription {
  id: string;
  user_id: string;
  provider_subscription_id: string;
  plan_interval: PlanInterval;
  status: SubscriptionStatus;
  current_period_start: Date | string;
  current_period_end: Date | string;
  cancel_at_period_end: boolean;
  cancellation_reason?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PaymentLog {
  id: string;
  user_id: string;
  provider_event_id: string;
  event_type: string;
  amount_in_minor_units: number;
  currency: string;
  payload_json: Record<string, unknown> | any;
  created_at: Date | string;
}

export interface ProrationResult {
  unusedCredit: number;
  netAmountDue: number;
}

export interface PlanConfig {
  interval: PlanInterval;
  name: string;
  priceInMinorUnits: number; // e.g. 2000 for $20.00, 20000 for $200.00
  currency: string;
  periodDays: number;
  features: string[];
}

export const PLANS: Record<PlanInterval, PlanConfig> = {
  monthly: {
    interval: "monthly",
    name: "Pro Monthly",
    priceInMinorUnits: 2000, // $20.00 in minor units (cents)
    currency: "USD",
    periodDays: 30,
    features: [
      "Full API Access",
      "Unlimited Webhook Ingestion",
      "Standard Support",
      "Real-time Dashboard Analytics",
    ],
  },
  yearly: {
    interval: "yearly",
    name: "Pro Yearly",
    priceInMinorUnits: 20000, // $200.00 in minor units (cents)
    currency: "USD",
    periodDays: 365,
    features: [
      "Everything in Pro Monthly",
      "2 Months Free (Save $40)",
      "Priority Support SLA",
      "Dedicated Technical Account Manager",
    ],
  },
};
