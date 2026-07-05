import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { BrandGate } from '@/components/BrandGate';

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl flex-1 px-8 py-8">
        <BrandGate>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Brand Portal</p>
              <h1 className="text-xl font-semibold text-white">Campaigns</h1>
            </div>
            <Link
              href="/brand/campaigns/new"
              className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              + New campaign
            </Link>
          </div>
          {children}
        </BrandGate>
      </div>
    </div>
  );
}
