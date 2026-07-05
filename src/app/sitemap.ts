import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/**
 * Only lists statically-known routes. Creator profile pages (`/[creatorname]`)
 * can't be enumerated here without a backend to list registered creators —
 * once that exists, this should fetch and append their URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: env.appUrl,
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
