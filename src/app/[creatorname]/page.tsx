import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { truncateAddress } from '@/lib/utils';
import { loadCreatorProfile } from '@/lib/creator-profile';

type PageProps = { params: Promise<{ creatorname: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { creatorname } = await params;
  const profile = await loadCreatorProfile(creatorname);
  if (!profile) return { title: 'Creator not found' };

  const title = `Tip ${profile.displayName} on StellarTok`;
  return {
    title,
    description: profile.bio,
    openGraph: { title, description: profile.bio },
    twitter: { title, description: profile.bio },
  };
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { creatorname } = await params;
  const profile = await loadCreatorProfile(creatorname);
  if (!profile) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="mb-10 flex flex-col items-center text-center">
          <Image
            src={profile.avatarUrl}
            alt={profile.displayName}
            width={96}
            height={96}
            className="mb-4 rounded-full border-2 border-brand"
          />
          <h1 className="text-2xl font-semibold text-white">{profile.displayName}</h1>
          <p className="text-sm text-white/50">@{profile.tiktokUsername}</p>
          <p className="mt-3 max-w-md text-sm text-white/70">{profile.bio}</p>
          <p className="mt-2 font-mono text-xs text-white/30">
            {truncateAddress(profile.walletAddress, 6)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profile.videos.map((video) => (
            <VideoCard key={video.id} video={video} creatorWalletAddress={profile.walletAddress} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
