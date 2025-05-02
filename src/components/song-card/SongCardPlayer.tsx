import React from 'react';
import { isValidSoundCloudUrl } from '@/lib/soundcloud';

interface SongCardPlayerProps {
  soundcloudUrl: string | null;
}

export const SongCardPlayer: React.FC<SongCardPlayerProps> = ({ soundcloudUrl }) => {
  return (
    <div className="aspect-[1.5] mb-3 rounded-lg overflow-hidden bg-gray-800/50">
      {soundcloudUrl && isValidSoundCloudUrl(soundcloudUrl) ? (
        <div className="w-full h-full">
          <iframe
            width="100%"
            height="100%"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
            className="rounded-lg"
            onError={(e) => {
              // Hide the iframe if it fails to load
              const target = e.target as HTMLIFrameElement;
              target.style.display = 'none';
              // Show the fallback message
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<p class="text-gray-500 text-sm flex items-center justify-center h-full">Preview not available</p>';
              }
            }}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500 text-sm">Preview not available</p>
        </div>
      )}
    </div>
  );
}; 