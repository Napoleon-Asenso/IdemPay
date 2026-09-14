"use client";

import React, { createContext, useContext, useState } from "react";

export type AppView = "plans" | "billing";

interface AppViewContextValue {
  view: AppView;
  setView: (view: AppView) => void;
  activePlan: string;
}

const AppViewContext = createContext<AppViewContextValue>({
  view: "plans",
  setView: () => {},
  activePlan: "free",
});

export function AppViewProvider({
  children,
  activePlan = "free",
}: {
  children: React.ReactNode;
  activePlan?: string;
}) {
  const [view, setView] = useState<AppView>("plans");

  return (
    <AppViewContext.Provider value={{ view, setView, activePlan }}>
      {children}
    </AppViewContext.Provider>
  );
}

export function useAppView() {
  return useContext(AppViewContext);
}