'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/live-stream', label: 'Live Stream Settings' },
  { href: '/dashboard/marketplace', label: 'Campaign Marketplace' },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-white/10 p-4">
      <nav className="space-y-1" aria-label="Dashboard">
        {LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-brand/15 text-brand-light'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
