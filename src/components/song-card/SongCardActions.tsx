import React from 'react';
import { Heart, Share2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { getFormattedDate } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VerificationActions } from '@/components/VerificationActions';
import { Song } from '@/types/song';
import { deleteSong } from '@/lib/firebase';

interface SongCardActionsProps {
  song: Song;
  onFavorite: (songId: string) => void;
  showActions?: boolean;
}

export const SongCardActions: React.FC<SongCardActionsProps> = ({
  song,
  onFavorite,
  showActions = false,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isSuperAdmin } = useAdmin();

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSuperAdmin) return;

    try {
      await deleteSong(song.id);
      toast.success('Song deleted successfully');
      // Refresh the page to update the song list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting song:', error);
      toast.error('Failed to delete song');
    }
  };

  const formatFavoriteCount = (count: number) => {
    if (count === 0) return '0';
    if (count < 1000) return count.toString();
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="flex items-center justify-between mt-auto">
      <div className="flex items-center gap-2">
        {showActions && <VerificationActions song={song} />}
        {isSuperAdmin && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete song</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {getFormattedDate(song.releaseDate)}
        </span>
      </div>
    </div>
  );
}; 