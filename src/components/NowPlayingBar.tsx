import React from 'react';
import { Song } from '@/types/song';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface NowPlayingBarProps {
  song: Song;
  playerState: {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
  };
}

const NowPlayingBar: React.FC<NowPlayingBarProps> = ({ song, playerState }) => {
  const { isPlaying, onPlayPause, onNext, onPrevious } = playerState;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="min-w-[48px] h-[48px] bg-gray-800 rounded overflow-hidden">
            {song.imageUrl && (
              <img 
                src={song.imageUrl} 
                alt={song.title} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <h3 className="font-medium text-white">{song.title}</h3>
            <p className="text-sm text-gray-400">{song.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="text-gray-400 hover:text-white"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="text-gray-400 hover:text-white"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="text-gray-400 hover:text-white"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingBar; 