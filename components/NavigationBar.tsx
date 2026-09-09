"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  const isPlans = pathname === "/plans";
  const isBilling = pathname === "/billing";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-lowest-color)] shadow-[var(--shadow-sm)]">
      {/* Top Banner if subscription is scheduled to cancel */}
      {cancelAtPeriodEnd && currentPeriodEnd && (
        <div className="w-full bg-[var(--color-tertiary-container-color)] px-[var(--spacing-4)] py-[var(--spacing-2)] text-center text-[var(--typography-font-size-sm)] font-medium text-[var(--color-on-tertiary-container-color)]">
          Your subscription will end on{" "}
          <span className="font-bold">
            {new Date(currentPeriodEnd).toLocaleDateString()}
          </span>
          . You retain full access until then.{" "}
          <Link
            href="/plans"
            className="underline hover:opacity-80 ml-2 font-semibold"
          >
            Click to Reactivate
          </Link>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between px-[var(--spacing-4)] sm:px-[var(--spacing-8)] py-[var(--spacing-3)]">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-6">
          <Link href="/plans" className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-color)] text-[var(--color-on-primary-color)] font-bold text-[var(--typography-font-size-lg)]">
              IP
            </div>
            <span className="text-[var(--typography-font-size-xl)] font-bold tracking-tight text-[var(--color-on-surface-color)]">
              IdemPay
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center space-x-1">
            <Link
              href="/plans"
              className={`rounded-[var(--radius-md)] px-[var(--spacing-3)] py-[var(--spacing-2)] text-[var(--typography-font-size-sm)] font-medium transition-colors ${
                isPlans
                  ? "bg-[var(--color-surface-container-high-color)] text-[var(--color-on-surface-color)]"
                  : "text-[var(--color-surface-variant-color)] hover:bg-[var(--color-surface-container-low-color)] hover:text-[var(--color-on-surface-color)]"
              }`}
            >
              Plans & Pricing
            </Link>
            <Link
              href="/billing"
              className={`rounded-[var(--radius-md)] px-[var(--spacing-3)] py-[var(--spacing-2)] text-[var(--typography-font-size-sm)] font-medium transition-colors ${
                isBilling
                  ? "bg-[var(--color-surface-container-high-color)] text-[var(--color-on-surface-color)]"
                  : "text-[var(--color-surface-variant-color)] hover:bg-[var(--color-surface-container-low-color)] hover:text-[var(--color-on-surface-color)]"
              }`}
            >
              Billing & History
            </Link>
          </nav>
        </div>

        {/* User Badge & Profile */}
        <div className="flex items-center space-x-3">
          {/* Active Plan Badge */}
          <div className="flex items-center space-x-2 rounded-full border border-[var(--color-outline-variant-color)] bg-[var(--color-surface-container-low-color)] px-[var(--spacing-3)] py-1 text-[var(--typography-font-size-xs)] font-semibold">
            <span className="h-2 w-2 rounded-full bg-[var(--color-secondary-color)]"></span>
            <span className="text-[var(--color-on-surface-color)] capitalize">
              {activePlan} Tier
            </span>
          </div>

          {/* User Profile Indicator */}
          <div className="flex items-center space-x-2 border-l border-[var(--color-outline-variant-color)] pl-3">
            <div className="h-8 w-8 rounded-full bg-[var(--color-primary-container-color)] text-[var(--color-on-primary-container-color)] flex items-center justify-center font-bold text-xs">
              {userEmail.substring(0, 2).toUpperCase()}
            </div>
            <span className="hidden md:inline text-[var(--typography-font-size-sm)] text-[var(--color-on-surface-color)] font-medium">
              {userEmail}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
