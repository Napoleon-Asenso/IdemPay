"use client";

import React, { useEffect } from "react";
import PlansView from "@/components/PlansView";
import { useAppView } from "@/components/AppView";

export default function PlansPage() {
  const { setView } = useAppView();

  useEffect(() => {
    setView("plans");
    document.title = "Pricing Plans | IdemPay";
  }, [setView]);

  return <PlansView />;
}
