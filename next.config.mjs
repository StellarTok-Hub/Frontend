/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
