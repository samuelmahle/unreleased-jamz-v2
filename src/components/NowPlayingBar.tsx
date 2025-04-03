import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Song } from '@/types/song';
import { toast } from 'sonner';

interface PlayerState {
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  playerRef: React.RefObject<HTMLIFrameElement>;
  widgetRef: React.MutableRefObject<any>;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
}

interface NowPlayingBarProps {
  song: Song | null;
  onPrevious?: () => void;
  onNext?: () => void;
  isFullScreen?: boolean;
  playerState: PlayerState;
}

const NowPlayingBar: React.FC<NowPlayingBarProps> = ({ 
  song, 
  onPrevious, 
  onNext, 
  isFullScreen = false,
  playerState
}) => {
  const navigate = useNavigate();
  const {
    isPlaying,
    currentPosition,
    duration,
    onPlay,
    onPause,
    onSeek,
    playerRef,
    widgetRef,
    setIsPlaying,
    setCurrentPosition,
    setDuration
  } = playerState;

  const isValidSoundCloudUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.startsWith('https://soundcloud.com/') || url.startsWith('https://on.soundcloud.com/');
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!song?.soundcloudUrl || !isValidSoundCloudUrl(song.soundcloudUrl) || !playerRef.current) {
      // Reset the player state when there's no valid SoundCloud URL
      setIsPlaying(false);
      setCurrentPosition(0);
      setDuration(0);
      return;
    }

    try {
      // Load SoundCloud Widget API if not already loaded
      if (!(window as any).SC) {
        const script = document.createElement('script');
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
          document.body.removeChild(script);
        };
      }

      widgetRef.current = (window as any).SC.Widget(playerRef.current);
      
      widgetRef.current.bind((window as any).SC.Widget.Events.PLAY, () => {
        setIsPlaying(true);
      });

      widgetRef.current.bind((window as any).SC.Widget.Events.PAUSE, () => {
        setIsPlaying(false);
      });

      widgetRef.current.bind((window as any).SC.Widget.Events.FINISH, () => {
        setIsPlaying(false);
        setCurrentPosition(0);
        if (onNext) {
          onNext();
        }
      });

      widgetRef.current.bind((window as any).SC.Widget.Events.READY, () => {
        widgetRef.current.getDuration((totalDuration: number) => {
          setDuration(totalDuration);
        });
      });

      // Start progress tracking when playing
      const progressInterval = setInterval(() => {
        if (isPlaying && widgetRef.current) {
          widgetRef.current.getPosition((pos: number) => {
            setCurrentPosition(pos);
          });
        }
      }, 1000);

      return () => {
        clearInterval(progressInterval);
        if (widgetRef.current) {
          try {
            widgetRef.current.unbind((window as any).SC.Widget.Events.PLAY);
            widgetRef.current.unbind((window as any).SC.Widget.Events.PAUSE);
            widgetRef.current.unbind((window as any).SC.Widget.Events.FINISH);
            widgetRef.current.unbind((window as any).SC.Widget.Events.READY);
          } catch (error) {
            console.error('Error cleaning up widget:', error);
          }
        }
      };
    } catch (error) {
      console.error('Error initializing SoundCloud widget:', error);
      // Reset player state on error
      setIsPlaying(false);
      setCurrentPosition(0);
      setDuration(0);
    }
  }, [song, playerRef.current]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!song?.soundcloudUrl || !isValidSoundCloudUrl(song.soundcloudUrl)) {
      toast.error('No playback URL available');
      return;
    }
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !song?.soundcloudUrl || !isValidSoundCloudUrl(song.soundcloudUrl)) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const position = percentage * duration;

    onSeek(position);
    setCurrentPosition(position);
  };

  if (!song) return null;

  return (
    <div 
      className={`fixed left-0 right-0 bg-[#282828] ${
        isFullScreen 
          ? 'bottom-[4.5rem] h-[168px]' 
          : 'bottom-[4.5rem] h-14'
      }`}
    >
      <div className={`flex flex-col h-full ${isFullScreen ? 'p-4' : 'px-4'}`}>
        {/* Song info */}
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center flex-1">
            <div className={`flex-shrink-0 bg-gray-800 rounded-sm overflow-hidden mr-3 ${
              isFullScreen ? 'h-14 w-14' : 'h-10 w-10'
            }`}>
              {song.artwork_url ? (
                <img 
                  src={song.artwork_url} 
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Music className="h-5 w-5 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-white truncate ${
                isFullScreen ? 'text-base' : 'text-sm'
              }`}>{song.title}</h3>
              <p className="text-xs text-gray-400 truncate">{song.artist}</p>
            </div>
          </div>

          {/* Mini player controls - moved inside the same flex container */}
          {!isFullScreen && (
            <div className="flex items-center gap-4 ml-4">
              <button
                className="text-gray-400 hover:text-white disabled:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious?.();
                }}
                disabled={!onPrevious}
              >
                <SkipBack className="h-5 w-5" />
              </button>

              <button 
                className="flex items-center justify-center rounded-full bg-white text-black h-8 w-8"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>

              <button
                className="text-gray-400 hover:text-white disabled:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onNext?.();
                }}
                disabled={!onNext}
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Full screen controls */}
        {isFullScreen && (
          <div className="flex-1 flex flex-col justify-end">
            {/* Progress bar */}
            <div className="mb-4">
              <div 
                className="relative w-full h-1 bg-gray-700 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div 
                  className="absolute left-0 top-0 h-full bg-white rounded-full"
                  style={{ width: `${(currentPosition / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-gray-400 font-medium">{formatTime(currentPosition)}</span>
                <span className="text-[11px] text-gray-400 font-medium">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-8">
              <button
                className="text-gray-400 hover:text-white disabled:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious?.();
                }}
                disabled={!onPrevious}
              >
                <SkipBack className="h-8 w-8" />
              </button>

              <button 
                className="flex items-center justify-center rounded-full bg-white text-black h-14 w-14"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7" />
                ) : (
                  <Play className="h-7 w-7" />
                )}
              </button>

              <button
                className="text-gray-400 hover:text-white disabled:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onNext?.();
                }}
                disabled={!onNext}
              >
                <SkipForward className="h-8 w-8" />
              </button>
            </div>
          </div>
        )}

        {!isFullScreen && (
          /* Mini player progress bar */
          <div 
            className="absolute top-0 left-0 right-0 h-1 bg-gray-700 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-music-accent"
              style={{ width: `${(currentPosition / duration) * 100}%` }}
            />
          </div>
        )}

        {/* Hidden SoundCloud iframe */}
        {song.soundcloudUrl && isValidSoundCloudUrl(song.soundcloudUrl) && (
          <iframe
            ref={playerRef}
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
            className="hidden"
            width="0"
            height="0"
            frameBorder="no"
            allow="autoplay"
          />
        )}
      </div>
    </div>
  );
};

export default NowPlayingBar; 