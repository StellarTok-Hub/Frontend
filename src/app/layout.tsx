import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { env } from '@/lib/env';
import './globals.css';

/**
 * Nonce-based CSP (see src/middleware.ts) needs a fresh nonce per request
 * embedded in the actual HTML Next serves — which a statically prerendered
 * page can't do, since its markup is generated once at build time, before
 * any request (and its nonce) exists. Reading `headers()` here opts every
 * route under this root layout into dynamic (per-request) rendering, which
 * is what makes the nonce Next embeds in its own hydration scripts match
 * the nonce in that request's CSP header. The trade-off: this app no
 * longer serves any fully static HTML, including the public /creatorname
 * tipping page — every request now renders server-side. Given this app's
 * highest-traffic page exists specifically to request a wallet-signing
 * action, and CSP's job is to protect exactly that action, this is the
 * right side of the trade-off; revisit only alongside a plan for
 * per-route CSP scoping if tipping-page load latency becomes a problem.
 */
export const dynamic = 'force-dynamic';

const title = 'StellarTok — Tips, live alerts, and brand payouts for TikTok creators';
const description =
  'Connect your TikTok and Stellar wallet to unlock instant micro-tipping, live-stream alerts, and trustless brand campaign payouts.';

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: title,
    template: '%s · StellarTok',
  },
  description,
  openGraph: {
    title,
    description,
    siteName: 'StellarTok',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
