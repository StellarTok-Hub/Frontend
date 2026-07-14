/**
 * No page in this app embeds another page in an iframe (grep confirms it),
 * and several pages exist specifically to request a wallet-transaction
 * signature — the kind of UI a clickjacking overlay targets. Denying
 * framing outright costs nothing here. This doesn't affect the OBS
 * overlay page: OBS Browser Source loads a URL directly in its own
 * embedded browser, it doesn't embed it via <iframe> in another document,
 * so frame-ancestors has no effect on it.
 *
 * Content-Security-Policy is intentionally not set here: it needs a
 * per-request nonce for Next's inline hydration scripts, which only
 * middleware can generate. See src/middleware.ts.
 */
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      // TikTok serves thumbnails/avatars from many rotating CDN subdomains
      // (p16-sign-<region>, p19-sign, etc.) across a few base domains —
      // wildcarding the subdomain avoids re-breaking every time TikTok
      // routes a user to a different edge host.
      {
        protocol: 'https',
        hostname: '**.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn-us.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn-eu.com',
      },
      {
        protocol: 'https',
        hostname: '**.ibyteimg.com',
      },
      // Used by src/lib/mock-data.ts fixtures only — safe to remove once real avatars/thumbnails exist.
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default nextConfig;
