import React, { useState, useEffect } from "react";
import SongCard from "@/components/SongCard";
import MusicPlayer from "@/components/MusicPlayer";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { toggleFavorite } from "@/lib/firebase";
import { toast } from "sonner";
import { Song } from "@/types/song";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HomePageProps {
  songs: Song[];
  searchTerm: string;
  onSongClick: (song: Song) => void;
  setSongs?: React.Dispatch<React.SetStateAction<Song[]>>;
}

const HomePage: React.FC<HomePageProps> = ({ songs = [], searchTerm, onSongClick, setSongs }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast: uiToast } = useToast();
  const { currentUser, userFavorites = [] } = useAuth();
  const [activeSong, setActiveSong] = useState<string | null>(null);
  const [showReleasingThisWeek, setShowReleasingThisWeek] = useState(false);

  const isReleasingThisWeek = (releaseDate: string | null) => {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return release >= now && release <= weekFromNow;
  };

  const getRecentFavoriteCount = (song: Song) => {
    if (!song.favoritedAt) return 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return song.favoritedAt.filter(date => new Date(date) >= weekAgo).length;
  };

  const sortedAndFilteredSongs = (songs || [])
    .filter(song => {
      const matchesSearch = 
        song.title.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        song.artist.toLowerCase().includes((searchTerm || '').toLowerCase());
      
      const matchesRelease = !showReleasingThisWeek || isReleasingThisWeek(song.releaseDate);
      
      return matchesSearch && matchesRelease;
    })
    .sort((a, b) => getRecentFavoriteCount(b) - getRecentFavoriteCount(a));

  // Update songs to reflect user favorites
  useEffect(() => {
    if (songs?.length > 0) {
      setSongs(prevSongs => 
        prevSongs.map(song => {
          const isFavorite = userFavorites.includes(song.id);
          const favoritedBy = song.favoritedBy || [];
          const favoritedAt = song.favoritedAt || [];
          
          // If the song is favorited but not in favoritedBy, add it
          if (isFavorite && !favoritedBy.includes(currentUser?.uid)) {
            favoritedBy.push(currentUser?.uid);
            favoritedAt.push(new Date().toISOString());
          }
          // If the song is not favorited but in favoritedBy, remove it
          if (!isFavorite && favoritedBy.includes(currentUser?.uid)) {
            const index = favoritedBy.indexOf(currentUser?.uid);
            favoritedBy.splice(index, 1);
            favoritedAt.splice(index, 1);
          }
          
          return {
            ...song,
            isFavorite,
            favoritedBy,
            favoritedAt
          };
        })
      );
    }
  }, [userFavorites, setSongs, songs, currentUser?.uid]);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  const handleToggleFavorite = async (songId: string) => {
    if (!currentUser) {
      toast.error("Please login to favorite songs");
      return;
    }
    
    const song = songs.find((s) => s.id === songId);
    if (!song) return;
    
    const newFavoriteStatus = !song.isFavorite;
    
    try {
      // Update Firebase
      await toggleFavorite(currentUser.uid, songId, newFavoriteStatus);
      
      toast.success(
        newFavoriteStatus ? "Added to favorites" : "Removed from favorites",
        { description: `"${song.title}" by ${song.artist}` }
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };

  const handleSongClick = (song: Song) => {
    console.log('HomePage: Song clicked:', song);
    try {
      // Validate song data before navigating
      const requiredFields = ['id', 'title', 'artist', 'uploadDate', 'updatedAt'];
      const missingFields = requiredFields.filter(field => !song[field]);
      
      if (missingFields.length > 0) {
        console.error('HomePage: Song data is incomplete:', missingFields);
        toast.error('Unable to play song: Missing required data');
        return;
      }

      console.log('HomePage: Song data is valid, calling onSongClick');
      onSongClick(song);
    } catch (error) {
      console.error('HomePage: Error handling song click:', error);
      toast.error('Unable to play song: An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Trending This Week</h1>
        <div className="flex items-center space-x-2">
          <Switch
            checked={showReleasingThisWeek}
            onCheckedChange={setShowReleasingThisWeek}
            id="release-week"
          />
          <Label htmlFor="release-week">Releasing This Week</Label>
        </div>
      </div>
      
      {sortedAndFilteredSongs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            {searchTerm 
              ? 'No songs match your search'
              : showReleasingThisWeek
                ? 'No songs releasing this week'
                : 'No songs available'}
          </p>
        </div>
      ) : (
        <div className="sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 flex flex-col space-y-2 sm:space-y-0">
          {sortedAndFilteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isActive={false}
              onFavorite={handleToggleFavorite}
              onClick={() => handleSongClick(song)}
            />
          ))}
        </div>
      )}
      
      {currentSong && (
        <MusicPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </div>
  );
};

export default HomePage;
