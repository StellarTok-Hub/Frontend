import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  {
    emoji: '🛠️',
    title: 'Bio-Link & Widget',
    description:
      'A custom stellartok.app/you page in your TikTok bio. Viewers tip USDC or XLM under any video, settled in seconds.',
  },
  {
    emoji: '🎮',
    title: 'Streamer Overlay Toolkit',
    description:
      'Drop an OBS Browser Source URL into your stream. Tips labeled "Play Sound" trigger alerts live, in real time.',
  },
  {
    emoji: '💼',
    title: 'Campaign Marketplace',
    description:
      'Brands fund a Stellar escrow and post a challenge. Post the content, get verified, get paid automatically.',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            The payments layer for <span className="text-brand-light">TikTok creators</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Connect TikTok and a Stellar wallet once. Unlock instant tipping, live-stream alerts,
            and trustless brand payouts — all in one place.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">I&apos;m a creator</Button>
            </Link>
            <Link href="/brand">
              <Button size="lg" variant="secondary">
                I&apos;m a brand
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <div className="mb-3 text-3xl">{feature.emoji}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
