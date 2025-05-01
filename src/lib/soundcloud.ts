export interface SoundCloudTrack {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url: string;
  user: {
    username: string;
  };
  duration: number;
}

interface SoundCloudSearchResult {
  collection: SoundCloudTrack[];
}

const SOUNDCLOUD_CLIENT_ID = "wTNCzjWctauhUJtUoQeXi9tLTw3rqGbN";

export const getSoundCloudEmbed = (url: string): string => {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
};

export const searchSoundCloudTracks = async (artist: string, title: string): Promise<SoundCloudTrack[]> => {
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const searchMatches = httpsCallable<{ artist: string, title: string }, SoundCloudTrack[]>(functions, 'searchSoundCloudMatches');
    const result = await searchMatches({ artist, title });
    return result.data;
  } catch (error) {
    console.error('SoundCloud search error:', error);
    throw error;
  }
};

export const extractSoundCloudData = (url: string) => {
  if (!url) return null;
  
  // Clean up the URL if needed
  const cleanUrl = url.split('?')[0];
  
  return {
    url: cleanUrl,
    embedUrl: getSoundCloudEmbed(cleanUrl)
  };
};

export const isValidSoundCloudUrl = (url: string | null): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'soundcloud.com' || urlObj.hostname === 'on.soundcloud.com';
  } catch {
    return false;
  }
}; 