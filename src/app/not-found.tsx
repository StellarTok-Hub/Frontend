import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm text-white/40">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-white/60">
          That creator profile or page doesn&apos;t exist.
        </p>
        <Link href="/" className="mt-6">
          <Button variant="secondary">Back home</Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
