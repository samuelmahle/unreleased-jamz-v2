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

    let widget: any = null;
    let isWidgetReady = false;
    let retryCount = 0;
    const maxRetries = 5;

    const initializeWidget = () => {
      try {
        if (!(window as any).SC) {
          if (retryCount < maxRetries) {
            console.log(`Waiting for SoundCloud API (attempt ${retryCount + 1}/${maxRetries})...`);
            retryCount++;
            setTimeout(initializeWidget, 500);
            return;
          } else {
            console.error('Failed to load SoundCloud API after multiple attempts');
            return;
          }
        }

        console.log('Setting up widget...');
        widget = (window as any).SC.Widget(playerRef.current);
        widgetRef.current = widget;

        widget.bind((window as any).SC.Widget.Events.READY, () => {
          console.log('Widget READY event fired');
          isWidgetReady = true;
          widget.getDuration((totalDuration: number) => {
            console.log('Got duration:', totalDuration);
            setDuration(totalDuration);
            
            // If we have a current position, seek to it
            if (currentPosition > 0) {
              widget.seekTo(currentPosition);
            }
            
            // If we should be playing, start playback once ready
            if (isPlaying) {
              console.log('Auto-playing because isPlaying is true');
              widget.play();
            }
          });
        });

        widget.bind((window as any).SC.Widget.Events.PLAY, () => {
          console.log('Widget PLAY event fired');
          setIsPlaying(true);
          onPlay();
        });

        widget.bind((window as any).SC.Widget.Events.PAUSE, () => {
          console.log('Widget PAUSE event fired');
          setIsPlaying(false);
          onPause();
        });

        widget.bind((window as any).SC.Widget.Events.FINISH, () => {
          console.log('Widget FINISH event fired');
          setIsPlaying(false);
          setCurrentPosition(0);
          if (onNext) {
            onNext();
          }
        });

        // Start progress tracking when playing
        const progressInterval = setInterval(() => {
          if (isPlaying && widget && isWidgetReady) {
            widget.getPosition((pos: number) => {
              setCurrentPosition(pos);
            });
          }
        }, 100);

        return () => {
          clearInterval(progressInterval);
          if (widget) {
            try {
              widget.pause();
              widget.unbind((window as any).SC.Widget.Events.PLAY);
              widget.unbind((window as any).SC.Widget.Events.PAUSE);
              widget.unbind((window as any).SC.Widget.Events.FINISH);
              widget.unbind((window as any).SC.Widget.Events.READY);
            } catch (error) {
              console.error('Error cleaning up widget:', error);
            }
          }
        };
      } catch (error) {
        console.error('Error setting up widget:', error);
      }
    };

    // Load SoundCloud Widget API if not already loaded
    if (!(window as any).SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        console.log('SoundCloud API script loaded');
        initializeWidget();
      };
      script.onerror = () => {
        console.error('Failed to load SoundCloud API script');
      };
    } else {
      initializeWidget();
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.pause();
          widgetRef.current = null;
        } catch (error) {
          console.error('Error cleaning up widget:', error);
        }
      }
    };
  }, [song?.soundcloudUrl]);

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!song?.soundcloudUrl || !isValidSoundCloudUrl(song.soundcloudUrl)) {
      toast.error('No playback URL available');
      return;
    }
    
    const widget = widgetRef.current;
    if (!widget) {
      console.error('Widget not initialized');
      toast.error('Player is initializing, please try again in a moment');
      return;
    }

    try {
      console.log('Play/Pause clicked, current state:', { isPlaying });
      
      if (isPlaying) {
        console.log('Pausing...');
        await new Promise((resolve) => widget.pause(resolve));
      } else {
        console.log('Playing...');
        await new Promise((resolve) => widget.play(resolve));
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
      toast.error('Playback control failed, please try again');
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !song?.soundcloudUrl || !isValidSoundCloudUrl(song.soundcloudUrl) || !widgetRef.current) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const position = percentage * duration;

    widgetRef.current.seekTo(position);
    onSeek(position);
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
          <div 
            className="flex items-center flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/song/${song.id}`)}
          >
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

        {/* Always render the SoundCloud iframe */}
        {song.soundcloudUrl && isValidSoundCloudUrl(song.soundcloudUrl) && (
          <iframe
            ref={playerRef}
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false&show_artwork=false&single_active=false&sharing=false&download=false&buying=false&show_playcount=false`}
            className="hidden"
            width="100%"
            height="100%"
            frameBorder="no"
            allow="autoplay"
          />
        )}
      </div>
    </div>
  );
};

export default NowPlayingBar; 