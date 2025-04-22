import React from "react";
import { useAuth } from '../contexts/AuthContext';
import { format } from "date-fns";
import { Heart, Share2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { toast } from "sonner";
import { Song } from "../types/song";
import { Timestamp } from "firebase/firestore"; // 👈 Added this import

const isValidSoundCloudUrl = (url: string | null): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'soundcloud.com' || urlObj.hostname === 'on.soundcloud.com';
  } catch {
    return false;
  }
};

// ✅ New utility to handle both Timestamp and string
const getFormattedDate = (date: any): string => {
  if (!date) return 'Release date unknown';
  
  try {
    let parsedDate: Date;
    
    if (date instanceof Timestamp) {
      parsedDate = date.toDate();
    } else if (typeof date === 'string') {
      // Try parsing ISO string first
      parsedDate = new Date(date);
      
      // If that fails, try parsing as a timestamp number
      if (isNaN(parsedDate.getTime())) {
        const timestamp = parseInt(date, 10);
        if (!isNaN(timestamp)) {
          parsedDate = new Date(timestamp);
        }
      }
    } else if (typeof date === 'number') {
      parsedDate = new Date(date);
    } else {
      return 'Release date unknown';
    }

    if (isNaN(parsedDate.getTime())) {
      return 'Release date unknown';
    }

    return format(parsedDate, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Release date unknown';
  }
};

interface SongCardProps {
  song: Song;
  onFavorite: (songId: string) => void;
  isActive: boolean;
  onClick?: () => void;  // Make onClick optional
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  onFavorite,
  isActive,
  onClick,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
    navigate(`/song/${song.id}`);
  };

  const handleArtistClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/artist/${userId}`);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please login to favorite songs', {
        description: 'Create an account to start building your collection',
        action: {
          label: 'Login',
          onClick: () => navigate('/login')
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
      className={`group relative flex flex-col bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer hover:bg-gray-800/50 transition-all duration-200 ${
        isActive ? "ring-2 ring-music" : "hover:ring-1 hover:ring-gray-700"
      }`}
      onClick={handleClick}
    >
      <div className="p-4 flex flex-col h-full">
        {/* Title and Artist Section */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold mb-1.5 truncate text-white group-hover:text-music-accent transition-colors">
            {song.title}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              {song.artists ? (
                <div className="flex flex-wrap gap-x-1 text-sm">
                  {song.artists.map((artist, index) => (
                    <React.Fragment key={index}>
                      <button
                        onClick={(e) => handleArtistClick(e, song.artistIds?.[index] || song.userId)}
                        className="text-gray-400 hover:text-white truncate"
                      >
                        {artist}
                      </button>
                      {index < song.artists.length - 1 && (
                        <span className="text-gray-600">,</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <button
                  onClick={(e) => handleArtistClick(e, song.userId)}
                  className="text-sm text-gray-400 hover:text-white truncate"
                >
                  {song.artist}
                </button>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-800/80 text-gray-300 font-medium flex-shrink-0">
              {song.genre || 'Electronic'}
            </span>
          </div>
      </div>

        {/* SoundCloud Player Section */}
        <div className="aspect-[16/10] mb-3 rounded-lg overflow-hidden bg-gray-800/50">
        {song.soundcloudUrl && isValidSoundCloudUrl(song.soundcloudUrl) ? (
            <div className="w-full h-full">
          <iframe
            width="100%"
            height="100%"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
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
      
        {/* Bottom Actions Section */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                    className="group/btn flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={handleFavorite}
                >
                  <Heart
                      className={`h-4 w-4 ${
                        song.isFavorite 
                          ? "fill-music-accent text-music-accent" 
                          : "text-gray-400 group-hover/btn:text-white"
                    }`}
                  />
                    <span className="text-xs text-gray-400 group-hover/btn:text-white">
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
                    className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={handleShare}
                >
                    <Share2 className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy share link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

          <span className="text-xs text-gray-500">
          {getFormattedDate(song.releaseDate)}
        </span>
        </div>
      </div>
    </div>
  );
};

export default SongCard;

