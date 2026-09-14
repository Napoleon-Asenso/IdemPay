"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppView, type AppView } from "@/components/AppView";
import { PLANS, type PlanInterval } from "@/types";

function getActivePlanPill(activePlan: string): string {
  const key = activePlan.toLowerCase() as PlanInterval;
  if (key === "monthly" || key === "yearly") {
    const plan = PLANS[key];
    const price = key === "yearly" ? "$200.00/yr" : "$20.00/mo";
    return `Active: ${plan.name} · ${price}`;
  }
  return "No Active Plan";
}

interface NavigationBarProps {
  activePlan?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  userEmail?: string;
}

export function NavigationBar({
  activePlan = "Free",
  cancelAtPeriodEnd = false,
  currentPeriodEnd = null,
  userEmail = "alex.dev@example.com",
}: NavigationBarProps) {
  const { view, setView } = useAppView();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = userEmail
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const avatarInitials =
    displayName
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks: { view: AppView; label: string }[] = [
    { view: "plans", label: "Plans" },
    { view: "billing", label: "Billing" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-background shadow-navbar">
      <div className="h-header-h px-space-md sm:px-space-lg md:px-page-x flex items-center justify-between">
        <div className="flex items-center gap-space-xl">
          <div className="flex items-center gap-space-sm" aria-label="IdemPay">
            <img
              src="/icon.svg"
              alt=""
              className="h-9 w-9 rounded-lg shadow-sm"
            />
            <span className="hidden lg:block font-headline-sm text-headline-sm text-on-surface tracking-tight">
              IdemPay
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-space-md">
            {navLinks.map((link) => (
              <button
                key={link.view}
                type="button"
                onClick={() => setView(link.view)}
                className={`px-space-md py-space-sm border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  view === link.view
                    ? "border-primary text-on-surface font-medium"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-primary"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-space-lg">
          <div className="hidden sm:flex items-center text-secondary">
            <span className="w-2 h-2 rounded-full bg-secondary mr-space-sm inline-block animate-pulse" />
            {getActivePlanPill(activePlan)}
          </div>

          {/* Account Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="material-symbols-outlined text-[1.5rem]">
                {menuOpen ? "close" : "menu"}
              </span>
            </button>

            <button
              type="button"
              className="hidden md:flex w-8 h-8 rounded-full bg-primary-container text-on-primary-container items-center justify-center cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="text-label-md font-label-md">{avatarInitials}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-space-sm w-72 bg-surface-container-lowest rounded-xl shadow-lg ring-1 ring-outline-variant/50 overflow-hidden">
                {/* User Info */}
                <div className="px-space-md py-space-md border-b border-surface-container bg-surface-container-low/50">
                  <div className="font-headline-sm text-headline-sm text-on-surface">
                    {displayName}
                  </div>
                  <div className="text-body-sm text-text-muted mt-space-xs break-all">
                    {userEmail}
                  </div>
                </div>

                <div className="divide-y divide-surface-container">
                  <div className="px-space-md py-space-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setView("plans");
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-space-sm text-body-md text-on-surface hover:text-primary transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <span className="material-symbols-outlined text-[1.125rem] text-text-muted">grid_view</span>
                      <span>Plans</span>
                    </button>
                  </div>
                  <div className="px-space-md py-space-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setView("billing");
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-space-sm text-body-md text-on-surface hover:text-primary transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <span className="material-symbols-outlined text-[1.125rem] text-text-muted">receipt_long</span>
                      <span>Billing</span>
                    </button>
                  </div>
                  <div className="px-space-md py-space-sm">
                    <button
                      type="button"
                      className="w-full flex items-center gap-space-sm text-body-md text-on-surface hover:text-error transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <span className="material-symbols-outlined text-[1.125rem] text-text-muted">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}