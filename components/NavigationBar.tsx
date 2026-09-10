"use client";

import React, { useEffect, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = userEmail
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPlans = pathname === "/plans";
  const isBilling = pathname === "/billing";

  const navLinks = [
    { href: "/plans", label: "Plans", active: isPlans },
    { href: "/billing", label: "Billing", active: isBilling },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 px-[72px] flex items-center justify-between">
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

          {/* Avatar Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-xl shadow-2xl ring-1 ring-outline-variant/50 overflow-hidden">
                {/* User Info */}
                <div className="px-space-md py-space-md">
                  <div className="font-headline-sm text-headline-sm text-on-surface">
                    {displayName}
                  </div>
                  <div className="text-body-sm text-text-muted mt-space-xs break-all">
                    {userEmail}
                  </div>
                </div>

                <div className="divide-y divide-surface-variant">
                  <div className="px-space-md py-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[18px] text-text-muted">workspace_premium</span>
                      <span className="text-body-md text-on-surface capitalize">
                        {activePlan === "Free" ? "Free Tier" : `${activePlan} Plan`}
                      </span>
                    </div>
                  </div>
                  <div className="px-space-md py-space-sm">
                    <Link
                      href="/billing"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-space-sm text-body-md text-on-surface hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-text-muted">receipt_long</span>
                      <span>Billing &amp; History</span>
                    </Link>
                  </div>
                  <div className="px-space-md py-space-sm">
                    <button
                      type="button"
                      className="w-full flex items-center gap-space-sm text-body-md text-on-surface hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-text-muted">logout</span>
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