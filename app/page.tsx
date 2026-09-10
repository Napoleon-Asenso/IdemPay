"use client";

import React, { useEffect } from "react";
import { useAppView } from "@/components/AppView";
import PlansView from "@/components/PlansView";
import BillingView from "@/components/BillingView";

export default function HomePage() {
  const { view, setView } = useAppView();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "billing") {
      setView("billing");
    }
  }, [setView]);

  useEffect(() => {
    document.title =
      view === "billing"
        ? "Billing & Subscription Management | IdemPay"
        : "Pricing Plans | IdemPay";
  }, [view]);

  return view === "billing" ? <BillingView /> : <PlansView />;
}