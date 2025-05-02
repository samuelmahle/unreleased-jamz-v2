import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Repeat, Shuffle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Song } from "@/types/song";

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentSong,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Failed to play audio:", error);
        });
      }
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      onNext();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onNext]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Failed to play audio:", error);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSeek = (values: number[]) => {
    const newTime = values[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-music-surface border-t border-border p-4 z-10">
      <audio
        ref={audioRef}
        src={currentSong?.audioUrl}
        preload="metadata"
      />
      
      <div className="flex flex-col space-y-2">
        <div className="w-full">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between max-w-screen-lg mx-auto w-full">
          <div className="w-1/3 flex items-center">
            {currentSong && (
              <>
                <div className="h-12 w-12 rounded bg-muted flex-shrink-0 mr-3">
                  {currentSong.imageUrl && (
                    <img 
                      src={currentSong.imageUrl} 
                      alt={currentSong.title} 
                      className="h-full w-full object-cover rounded"
                    />
                  )}
                </div>
                <div className="truncate">
                  <div className="font-medium truncate">{currentSong.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{currentSong.artist}</div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-4 w-1/3">
            <button className="text-muted-foreground hover:text-white">
              <Shuffle className="h-5 w-5" />
            </button>
            <button 
              onClick={onPrevious}
              className="text-muted-foreground hover:text-white"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={onPlayPause}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button 
              onClick={onNext}
              className="text-muted-foreground hover:text-white"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-white">
              <Repeat className="h-5 w-5" />
            </button>
          </div>
          
          <div className="w-1/3 flex items-center justify-end">
            <button
              onClick={toggleMute}
              className="text-muted-foreground hover:text-white mr-2"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values) => setVolume(values[0] / 100)}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
