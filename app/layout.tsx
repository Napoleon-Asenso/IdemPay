import type { Metadata } from "next";
import "./globals.css";
import { NavigationBar } from "@/components/NavigationBar";
import { AppViewProvider } from "@/components/AppView";
import { prisma } from "@/lib/prisma";
import { ensureCurrentPeriod } from "@/lib/subscription-periods";

const siteName = "IdemPay";
const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://idempay.app").replace(/\/$/, "");
const siteDescription =
  "Production-grade SaaS billing lifecycle management with exact whole-minor-unit proration, idempotent Flutterwave webhooks, and zero-trust subscription entitlements.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  generator: "Next.js",
  creator: siteName,
  publisher: siteName,
  category: "technology",
  referrer: "origin-when-cross-origin",
  keywords: [
    "SaaS billing",
    "subscription management",
    "payment infrastructure",
    "Flutterwave checkout",
    "proration",
    "idempotent webhooks",
    "zero-trust billing",
    "IdemPay",
  ],
  authors: [{ name: siteName, url: siteUrl }],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  title: {
    default: `${siteName} — Zero-Trust Payment and Subscription Infrastructure`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: `${siteName} — Zero-Trust Payment and Subscription Infrastructure`,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "IdemPay — Zero-Trust Payment and Subscription Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Zero-Trust Payment and Subscription Infrastructure`,
    description: siteDescription,
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/apple-touch-icon.png`,
      description: siteDescription,
    },
    {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      publisher: { "@id": `${siteUrl}#organization` },
    },
  ],
};

async function getSubscriptionState() {
  try {
    const user = await prisma.users.findFirst({
      where: { email: "alex.dev@example.com" },
      include: { subscription: true },
    });

    if (user?.subscription && user.subscription.status === "active") {
      // Period maintenance: keep the displayed dates current if the billing
      // window has rolled past its end (no tier/status changes happen here).
      const refreshed = await ensureCurrentPeriod(user.subscription.id);
      const periodEnd =
        refreshed?.current_period_end ?? user.subscription.current_period_end;

      return {
        activePlan: user.subscription.plan_interval,
        cancelAtPeriodEnd: user.subscription.cancel_at_period_end,
        currentPeriodEnd: periodEnd.toISOString(),
        pendingPlanInterval: user.subscription.pending_plan_interval ?? null,
        email: user.email,
      };
    }
  } catch (err) {
    // Database may be initializing during build
  }

  return {
    activePlan: "Free",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    pendingPlanInterval: null,
    email: "alex.dev@example.com",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = await getSubscriptionState();

  return (
    <html lang="en" data-theme="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="bg-background font-body-md text-on-surface h-screen flex flex-col overflow-hidden">
        <AppViewProvider
          activePlan={state.activePlan}
          cancelAtPeriodEnd={state.cancelAtPeriodEnd}
          currentPeriodEnd={state.currentPeriodEnd}
          pendingPlanInterval={state.pendingPlanInterval}
        >
          <NavigationBar
            activePlan={state.activePlan}
            cancelAtPeriodEnd={state.cancelAtPeriodEnd}
            currentPeriodEnd={state.currentPeriodEnd}
            userEmail={state.email}
          />
          <main className="flex-1 overflow-y-auto pt-header-h w-full bg-background">
            {children}
          </main>
        </AppViewProvider>
      </body>
    </html>
  );
}
