import React from "react";
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from "date-fns";
import { Heart, Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { toast } from "sonner";
import { Song } from "../types/song";

const isValidDate = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

const isValidSoundCloudUrl = (url: string | null): boolean => {
  if (!url) return false;
  return url.startsWith('https://soundcloud.com/') || url.startsWith('https://on.soundcloud.com/');
};

interface SongCardProps {
  song: Song;
  onClick: () => void;
  onFavorite: (songId: string) => void;
  isActive: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  onClick,
  onFavorite,
  isActive,
}) => {
  const { currentUser } = useAuth();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please login to favorite songs', {
        description: 'Create an account to start building your collection',
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/login'
        },
      });
      return;
    }
    onFavorite(song.id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/song/${song.id}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const formatFavoriteCount = (count: number) => {
    if (count === 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <div
      className={`song-card relative flex flex-col bg-music-surface rounded-lg overflow-hidden cursor-pointer p-2 sm:p-4 ${
        isActive ? "border-2 border-music" : "border border-gray-800"
      }`}
      onClick={onClick}
    >
      <div className="mb-2 sm:mb-3">
        <h3 className="text-base sm:text-lg font-semibold mb-0.5 sm:mb-1 truncate text-white">{song.title}</h3>
        <p className="text-sm sm:text-base text-gray-300 truncate">{song.artist}</p>
      </div>

      <div className="aspect-[16/9] sm:aspect-[4/3] mb-2 sm:mb-3">
        {song.soundcloudUrl && isValidSoundCloudUrl(song.soundcloudUrl) ? (
          <iframe
            width="100%"
            height="100%"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23ff5500&auto_play=${isActive ? 'true' : 'false'}&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
            style={{ display: 'block' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-xs sm:text-sm">Link not available</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-auto">
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="h-8 sm:h-10 w-8 sm:w-10 inline-flex flex-col items-center justify-center rounded-md hover:bg-gray-700 transition-colors"
                  onClick={handleFavorite}
                >
                  <Heart
                    className={`h-3.5 sm:h-5 w-3.5 sm:w-5 ${
                      song.isFavorite ? "fill-music-accent text-music-accent" : "text-gray-400 hover:text-white"
                    }`}
                  />
                  <span className="text-[10px] sm:text-xs mt-0.5 text-gray-400">
                    {formatFavoriteCount(song.favoritedBy?.length || 0)}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{song.isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="h-8 sm:h-10 w-8 sm:w-10 inline-flex items-center justify-center rounded-md hover:bg-gray-700 transition-colors"
                  onClick={handleShare}
                >
                  <Share2 className="h-3.5 sm:h-5 w-3.5 sm:w-5 text-gray-400 hover:text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy share link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <span className="text-[10px] sm:text-xs text-gray-400">
          {isValidDate(song.releaseDate)
            ? formatDistanceToNow(new Date(song.releaseDate!), { addSuffix: true })
            : 'Release date unknown'}
        </span>
      </div>
    </div>
  );
};

export default SongCard;
