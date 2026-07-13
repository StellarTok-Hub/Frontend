/**
 * No page in this app embeds another page in an iframe (grep confirms it),
 * and several pages exist specifically to request a wallet-transaction
 * signature — the kind of UI a clickjacking overlay targets. Denying
 * framing outright costs nothing here. This doesn't affect the OBS
 * overlay page: OBS Browser Source loads a URL directly in its own
 * embedded browser, it doesn't embed it via <iframe> in another document,
 * so frame-ancestors has no effect on it.
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
  {
    /**
     * script-src/style-src keep 'unsafe-inline' — Next.js App Router
     * injects inline <script> tags for RSC/hydration payloads on every
     * page, and a nonce-based CSP (the alternative to 'unsafe-inline')
     * needs per-request nonce plumbing through middleware that's a bigger
     * change than this pass covers. The directives that *do* matter for
     * this app's actual risk (no framing, no plugin content, no silent
     * form hijack to a third-party origin) are enforced without it:
     * frame-ancestors backs up X-Frame-Options, object-src blocks legacy
     * plugin content, base-uri/form-action stop a base-tag or form-target
     * injection from redirecting page context or form submissions
     * off-origin.
     */
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
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
