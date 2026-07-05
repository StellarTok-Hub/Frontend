import { getCreatorProfile } from './api';
import { mockCreatorProfile } from './mock-data';
import type { CreatorProfile } from '@/types';

export async function loadCreatorProfile(username: string): Promise<CreatorProfile | null> {
  try {
    return await getCreatorProfile(username);
  } catch {
    // Backend isn't live yet — fall back to the fixture so the page still renders.
    return username === mockCreatorProfile.tiktokUsername ? mockCreatorProfile : null;
  }
}
