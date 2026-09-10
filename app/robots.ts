import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://idempay.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}