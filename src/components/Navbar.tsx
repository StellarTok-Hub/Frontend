import Link from 'next/link';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { TikTokSignInButton } from '@/components/TikTokSignInButton';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Creator Dashboard' },
  { href: '/brand', label: 'For Brands' },
];

export function Navbar() {
  return (
    <header className="border-b border-white/10 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-white">
          Stellar<span className="text-brand-light">Tok</span>
        </Link>

        <nav className="hidden gap-6 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <TikTokSignInButton />
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
