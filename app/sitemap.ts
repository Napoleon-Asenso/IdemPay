import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://idempay.app").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${siteUrl}/plans`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/billing`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}