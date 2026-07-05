import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { env } from '@/lib/env';
import './globals.css';

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
