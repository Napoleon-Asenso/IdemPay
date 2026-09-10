"use client";

import React, { createContext, useContext, useState } from "react";

export type AppView = "plans" | "billing";

interface AppViewContextValue {
  view: AppView;
  setView: (view: AppView) => void;
}

const AppViewContext = createContext<AppViewContextValue>({
  view: "plans",
  setView: () => {},
});

export function AppViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<AppView>("plans");

  return (
    <AppViewContext.Provider value={{ view, setView }}>
      {children}
    </AppViewContext.Provider>
  );
}

export function useAppView() {
  return useContext(AppViewContext);
}