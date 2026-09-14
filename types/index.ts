export type PlanInterval = "free" | "monthly" | "yearly";

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
  payment_method?: string | null;
  status?: string | null;
  gateway?: string;
  transaction_id?: string | null;
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
  priceInMinorUnits: number;
  currency: string;
  periodDays: number;
  features: string[];
}

export const PLANS: Record<PlanInterval, PlanConfig> = {
  free: {
    interval: "free",
    name: "Starter",
    priceInMinorUnits: 0,
    currency: "USD",
    periodDays: 0,
    features: [
      "Up to 3 active subscriptions tracked",
      "Standard renewal alerts (Email)",
    ],
  },
  monthly: {
    interval: "monthly",
    name: "Monthly Pro",
    priceInMinorUnits: 2000,
    currency: "USD",
    periodDays: 30,
    features: [
      "Unlimited subscription tracking",
      "Instant SMS & Email alerts",
      "Automated cancellation concierge",
      "Advanced spending analytics & export",
    ],
  },
  yearly: {
    interval: "yearly",
    name: "Yearly Scale",
    priceInMinorUnits: 20000,
    currency: "USD",
    periodDays: 365,
    features: [
      "Everything in Monthly Pro",
      "Priority 24/7 concierge support",
      "Custom category tagging & budgets",
      "Dedicated account manager",
    ],
  },
};
