import React from 'react';
import { Badge } from '../ui/badge';
import { Song } from '@/types/song';
import { useNavigate } from 'react-router-dom';

interface SongCardHeaderProps {
  song: Song;
}

export const SongCardHeader: React.FC<SongCardHeaderProps> = ({ song }) => {
  const navigate = useNavigate();

  const handleArtistClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/artist/${userId}`);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h3 className="text-lg font-semibold truncate text-white group-hover:text-music-accent transition-colors">
          {song.title}
        </h3>
        {song.verificationStatus === 'pending' ? (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Pending • {Math.max(0, (song.upvotes || 0) - (song.downvotes || 0))}/3
          </Badge>
        ) : song.verificationStatus === 'artist_verified' ? (
          <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
            Artist Verified
          </Badge>
        ) : null}
      </div>
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
  );
}; 