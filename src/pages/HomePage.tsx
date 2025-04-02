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
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  searchTerm: string;
}

const HomePage: React.FC<HomePageProps> = ({ songs, setSongs, searchTerm }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast: uiToast } = useToast();
  const { currentUser, userFavorites } = useAuth();
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

  const sortedAndFilteredSongs = songs
    .filter(song => {
      const matchesSearch = 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRelease = !showReleasingThisWeek || isReleasingThisWeek(song.releaseDate);
      
      return matchesSearch && matchesRelease;
    })
    .sort((a, b) => getRecentFavoriteCount(b) - getRecentFavoriteCount(a));

  // Update songs to reflect user favorites
  useEffect(() => {
    if (userFavorites.length > 0) {
      setSongs(prevSongs => 
        prevSongs.map(song => ({
          ...song,
          isFavorite: userFavorites.includes(song.id)
        }))
      );
    }
  }, [userFavorites, setSongs]);

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
      
      // Update local state
      setSongs((prevSongs) =>
        prevSongs.map((s) =>
          s.id === songId
            ? { ...s, isFavorite: newFavoriteStatus }
            : s
        )
      );
      
      toast.success(
        newFavoriteStatus ? "Added to favorites" : "Removed from favorites",
        { description: `"${song.title}" by ${song.artist}` }
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };

  const handleFavorite = async (songId: string) => {
    if (!currentUser) return;

    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const isFavoriting = !song.isFavorite;
    
    // Optimistically update UI
    setSongs(songs.map(s => {
      if (s.id === songId) {
        return {
          ...s,
          isFavorite: isFavoriting,
          favoritedBy: isFavoriting 
            ? [...(s.favoritedBy || []), currentUser.uid]
            : (s.favoritedBy || []).filter(id => id !== currentUser.uid),
          favoritedAt: isFavoriting
            ? [...(s.favoritedAt || []), new Date().toISOString()]
            : s.favoritedAt
        };
      }
      return s;
    }));

    // Update backend
    await toggleFavorite(currentUser.uid, songId, isFavoriting);
  };

  return (
    <div className="pt-6 pb-32">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trending This Week</h1>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedAndFilteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isActive={activeSong === song.id}
              onClick={() => setActiveSong(song.id)}
              onFavorite={handleFavorite}
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
