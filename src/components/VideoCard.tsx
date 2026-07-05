import Image from 'next/image';
import { TipButton } from '@/components/TipButton';
import type { TikTokVideo } from '@/types';

export function VideoCard({
  video,
  creatorWalletAddress,
}: {
  video: TikTokVideo;
  creatorWalletAddress: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
      <div className="relative aspect-[9/16] w-full bg-ink-950">
        <Image
          src={video.thumbnailUrl}
          alt={video.caption}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-3 p-4">
        <p className="line-clamp-2 text-sm text-white/80">{video.caption}</p>
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{video.viewCount.toLocaleString()} views</span>
          <span>{video.likeCount.toLocaleString()} likes</span>
        </div>
        <TipButton creatorWalletAddress={creatorWalletAddress} videoId={video.id} />
      </div>
    </div>
  );
}
