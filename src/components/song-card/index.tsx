import React from "react";
import { useAuth } from '../../contexts/AuthContext';
import { format } from "date-fns";
import { Heart, Share2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { toast } from "sonner";
import { Song } from "../../types/song";
import { Timestamp } from "firebase/firestore";
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

const isValidSoundCloudUrl = (url: string | null): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'soundcloud.com' || urlObj.hostname === 'on.soundcloud.com';
  } catch {
    return false;
  }
};

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
  onFavorite?: (songId: string) => Promise<void>;
  isActive?: boolean;
  onClick?: () => void;
  showVerificationStatus?: boolean;
  onUpvote?: (songId: string) => void;
  onDownvote?: (songId: string) => void;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  onFavorite,
  isActive,
  onClick,
  showVerificationStatus = false,
  onUpvote,
  onDownvote,
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
    onFavorite?.(song.id);
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

        {showVerificationStatus && song.verificationStatus === 'pending' && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
              Pending • {Math.max(0, ((song.upvotes?.length || 0) - (song.downvotes?.length || 0)))}/3
            </Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  song.upvotes?.includes(currentUser?.uid)
                    ? 'bg-green-500/10 text-green-500'
                    : 'text-gray-400 hover:text-green-500'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpvote?.(song.id);
                }}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {song.upvotes?.length || 0}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  song.downvotes?.includes(currentUser?.uid)
                    ? 'bg-red-500/10 text-red-500'
                    : 'text-gray-400 hover:text-red-500'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownvote?.(song.id);
                }}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {song.downvotes?.length || 0}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongCard; 