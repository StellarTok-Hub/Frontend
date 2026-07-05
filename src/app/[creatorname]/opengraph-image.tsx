import { ImageResponse } from 'next/og';
import { loadCreatorProfile } from '@/lib/creator-profile';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'StellarTok creator tipping profile';

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ creatorname: string }>;
}) {
  const { creatorname } = await params;
  const profile = await loadCreatorProfile(creatorname);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0A0F 0%, #1A0A2E 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 28,
          color: '#A855F7',
          marginBottom: 24,
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        STELLARTOK
      </div>
      <div style={{ fontSize: 64, fontWeight: 700, display: 'flex' }}>
        {profile ? `Tip ${profile.displayName}` : 'Creator not found'}
      </div>
      {profile && (
        <div
          style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', marginTop: 16, display: 'flex' }}
        >
          @{profile.tiktokUsername} · Instant USDC & XLM tips
        </div>
      )}
    </div>,
    size,
  );
}
