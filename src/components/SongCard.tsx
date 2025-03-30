
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MoreHorizontal, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite(song.id);
  };

  return (
    <div
      className={cn(
        "song-card relative flex flex-col bg-music-surface rounded-lg overflow-hidden cursor-pointer p-3",
        isActive && "border border-music"
      )}
      onClick={onClick}
    >
      <div className="relative aspect-square mb-3 group">
        <img
          src={song.imageUrl || "/placeholder.svg"}
          alt={song.title}
          className="w-full h-full object-cover rounded-md"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
          <Button
            size="icon"
            variant="secondary"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-music text-white hover:bg-music-light"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{song.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
        
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleFavorite}
                >
                  <Heart
                    className={cn("h-4 w-4", song.isFavorite ? "fill-music-accent text-music-accent" : "text-muted-foreground")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{song.isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More options</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="flex justify-between mt-auto pt-2">
        <span className="text-xs text-muted-foreground">{song.genre}</span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(song.releaseDate), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

export default SongCard;
