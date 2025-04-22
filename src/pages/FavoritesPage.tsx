import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Song } from '@/types/song';
import SongCard from '@/components/SongCard';
import { toggleFavorite } from '@/lib/firebase';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FavoritesPageProps {
  songs: Song[];
  searchTerm: string;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ songs, searchTerm }) => {
  const { currentUser, userFavorites } = useAuth();
  const navigate = useNavigate();
  const [activeSong, setActiveSong] = useState<string | null>(null);
  const [showReleasingThisWeek, setShowReleasingThisWeek] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const isReleasingThisWeek = (releaseDate: string | null) => {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return release >= now && release <= weekFromNow;
  };

  const handleFavorite = async (songId: string) => {
    if (!currentUser) {
      toast.error('Please login to favorite songs');
      return;
    }

    try {
      const isFavoriting = !userFavorites.includes(songId);
      await toggleFavorite(currentUser.uid, songId, isFavoriting);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const filteredSongs = songs.filter(song => 
    userFavorites.includes(song.id) &&
    (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
     song.genre.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!showReleasingThisWeek || isReleasingThisWeek(song.releaseDate))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Favorites</h1>
        <div className="flex items-center space-x-2">
          <Switch
            checked={showReleasingThisWeek}
            onCheckedChange={setShowReleasingThisWeek}
            id="release-week"
          />
          <Label htmlFor="release-week">Releasing This Week</Label>
        </div>
      </div>
      
      {filteredSongs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            {searchTerm 
              ? 'No favorite songs match your search'
              : showReleasingThisWeek
                ? 'No favorite songs releasing this week'
                : 'No favorite songs yet. Start adding some!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={{
                ...song,
                isFavorite: userFavorites.includes(song.id)
              }}
              isActive={activeSong === song.id}
              onClick={() => setActiveSong(song.id)}
              onFavorite={handleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage; 