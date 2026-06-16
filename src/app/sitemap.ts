import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xhunt.app';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/home`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/missions`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return staticRoutes;
}
