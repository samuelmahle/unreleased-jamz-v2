import React, { useState, useEffect } from "react";
import SongCard from "@/components/SongCard";
import MusicPlayer from "@/components/MusicPlayer";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { toggleFavorite, updateExistingSongsWithGenre } from "@/lib/firebase";
import { toast } from "sonner";
import { Song } from "@/types/song";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Music } from 'lucide-react';

const GENRES = [
  "All",
  "Electronic",
  "Rap",
  "Pop",
  "Country",
  "Rock",
  "Other"
];

interface HomePageProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  searchTerm: string;
}

const HomePage: React.FC<HomePageProps> = ({ songs = [], setSongs, searchTerm }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast: uiToast } = useToast();
  const { currentUser, userFavorites = [] } = useAuth();
  const [activeSong, setActiveSong] = useState<string | null>(null);
  const [showReleasingThisWeek, setShowReleasingThisWeek] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [isUpdatingGenres, setIsUpdatingGenres] = useState(false);
  const navigate = useNavigate();

  const parseDate = (date: any): Date | null => {
    if (!date) return null;
    
    try {
      if (date instanceof Timestamp) {
        return date.toDate();
      }
      
      if (typeof date === 'string') {
        // Handle "April 11, 2025" format
        if (date.includes(',')) {
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }

        // Try parsing as ISO string
        const isoDate = new Date(date);
        if (!isNaN(isoDate.getTime())) {
          return isoDate;
        }
        
        // Try parsing as timestamp
        const timestamp = parseInt(date, 10);
        if (!isNaN(timestamp)) {
          return new Date(timestamp);
        }
      }
      
      if (typeof date === 'number') {
        return new Date(date);
      }

      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  const isReleasingThisWeek = (releaseDate: string | null) => {
    if (!releaseDate) return false;
    const parsedDate = parseDate(releaseDate);
    if (!parsedDate) return false;
    
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return parsedDate >= now && parsedDate <= weekFromNow;
  };

  const isArchived = (releaseDate: string | null): boolean => {
    if (!releaseDate) return false;
    const parsedDate = parseDate(releaseDate);
    if (!parsedDate) return false;
    
    const now = new Date();
    return parsedDate < now;
  };

  const getRecentFavoriteCount = (song: Song) => {
    if (!song.favoritedAt) return 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return song.favoritedAt.filter(date => new Date(date) >= weekAgo).length;
  };

  // Update existing songs with genre
  useEffect(() => {
    const updateSongs = async () => {
      try {
        setIsUpdatingGenres(true);
        await updateExistingSongsWithGenre();
        // Force a reload of the songs list after updating genres
        window.location.reload();
      } catch (error) {
        console.error('Error updating songs with genre:', error);
        toast.error('Error updating song genres');
      } finally {
        setIsUpdatingGenres(false);
      }
    };

    // Only run the update if there are songs without genres
    const needsUpdate = songs.some(song => !song.genre);
    if (needsUpdate) {
      updateSongs();
    }
  }, [songs]);

  const sortedAndFilteredSongs = (songs || [])
    .filter(song => {
      const matchesSearch = 
        song.title.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        song.artist.toLowerCase().includes((searchTerm || '').toLowerCase());
      
      const matchesRelease = !showReleasingThisWeek || isReleasingThisWeek(song.releaseDate);
      
      const matchesGenre = selectedGenre === "All" || song.genre === selectedGenre;
      
      // Don't show archived songs
      const isNotArchived = !isArchived(song.releaseDate);
      
      return matchesSearch && matchesRelease && matchesGenre && isNotArchived;
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

  const handleToggleFavorite = async (songId: string) => {
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

    const song = songs.find((s) => s.id === songId);
    if (!song) return;

    try {
      const newFavoriteStatus = !song.isFavorite;
      await toggleFavorite(currentUser.uid, songId, newFavoriteStatus);
      
      // Update the songs list immediately
      setSongs(prevSongs => 
        prevSongs.map(s => 
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
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-music" />
          <h2 className="text-xl font-semibold">
            {searchTerm ? 'Search Results' : 'Trending This Week'}
          </h2>
        </div>

        {sortedAndFilteredSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onFavorite={handleToggleFavorite}
                isActive={activeSong === song.id}
                onClick={() => setActiveSong(song.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-gray-400">
            {searchTerm ? 'No songs found matching your search.' : 'No songs available.'}
          </p>
        )}
      </section>
      
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
