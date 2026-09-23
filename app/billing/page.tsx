"use client";

import React, { useEffect } from "react";
import BillingView from "@/components/BillingView";
import { useAppView } from "@/components/AppView";

export default function BillingPage() {
  const { setView } = useAppView();

  useEffect(() => {
    setView("billing");
    document.title = "Billing & Subscription Management | IdemPay";
  }, [setView]);

  return <BillingView />;
}
