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

  const navLinks = [
    { href: "/plans", label: "Plans", active: isPlans },
    { href: "/billing", label: "Billing", active: isBilling },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-7xl mx-auto px-gutter flex items-center justify-between">
        <div className="flex items-center gap-space-xl">
          <div className="flex items-center">
            <img
              src="/icon.svg"
              alt="IdemPay logo"
              aria-label="IdemPay"
              className="h-9 w-9 rounded-lg shadow-sm"
            />
          </div>
          <nav className="hidden md:flex items-center gap-space-md">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-space-md py-space-xs rounded-lg transition-colors ${
                  link.active
                    ? "bg-primary-container text-on-primary-container font-medium"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-space-lg">
          <div className="hidden sm:flex items-center px-space-md py-space-xs rounded-full bg-secondary-container text-on-secondary-container text-label-md">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2 inline-block" />
            {activePlan === "Free"
              ? "No Active Plan"
              : `Active: ${activePlan.charAt(0).toUpperCase() + activePlan.slice(1)} - $20/mo`}
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
