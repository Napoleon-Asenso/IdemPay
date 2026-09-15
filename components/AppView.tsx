"use client";

import React, { createContext, useContext, useState } from "react";

export type AppView = "plans" | "billing";

interface AppViewContextValue {
  view: AppView;
  setView: (view: AppView) => void;
  activePlan: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  pendingPlanInterval: string | null;
}

const AppViewContext = createContext<AppViewContextValue>({
  view: "plans",
  setView: () => {},
  activePlan: "free",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  pendingPlanInterval: null,
});

export function AppViewProvider({
  children,
  activePlan = "free",
  cancelAtPeriodEnd = false,
  currentPeriodEnd = null,
  pendingPlanInterval = null,
}: {
  children: React.ReactNode;
  activePlan?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  pendingPlanInterval?: string | null;
}) {
  const [view, setView] = useState<AppView>("plans");

  return (
    <AppViewContext.Provider
      value={{
        view,
        setView,
        activePlan,
        cancelAtPeriodEnd,
        currentPeriodEnd,
        pendingPlanInterval,
      }}
    >
      {children}
    </AppViewContext.Provider>
  );
}

export function useAppView() {
  return useContext(AppViewContext);
}