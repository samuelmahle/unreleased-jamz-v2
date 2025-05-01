import React, { useState, useEffect } from "react";
import SongCard from "@/components/song-card";
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
import { getRecommendedSongs } from '@/lib/recommendations';
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
  const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

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

  // Filter and sort songs
  const filteredSongs = songs
    .filter(song => song.verificationStatus !== 'pending')
    .filter(song => {
      // Filter out already released songs
      if (!showReleasingThisWeek) {
        const releaseDate = parseDate(song.releaseDate);
        if (releaseDate && releaseDate < new Date()) {
          return false;
        }
      }
      
      if (!searchTerm) return true; // If no search term, show all songs
      
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = song.title?.toLowerCase().includes(searchLower) || false;
      const artistMatch = song.artists?.some(artist => 
        artist?.toLowerCase().includes(searchLower)
      ) || false;
      const genreMatch = song.genre?.toLowerCase().includes(searchLower) || false;
      
      return titleMatch || artistMatch || genreMatch;
    })
    .filter(song => {
      const matchesGenre = selectedGenre === "All" || song.genre === selectedGenre;
      const matchesReleaseFilter = !showReleasingThisWeek || isReleasingThisWeek(song.releaseDate);
      return matchesGenre && matchesReleaseFilter;
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

  // Add useEffect to handle songs updates
  useEffect(() => {
    console.log('Songs updated:', songs);
  }, [songs]);

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
      await toggleFavorite(currentUser.uid, songId);
      
      // Let the AuthContext handle the state update
      // The userFavorites listener in AuthContext will trigger a re-render
      toast.success(
        song.isFavorite ? "Removed from favorites" : "Added to favorites",
        { description: `"${song.title}" by ${song.artist}` }
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!currentUser?.profileData) {
        console.log('Cannot load recommendations: No user profile data');
        console.log('Current user state:', currentUser ? 'Logged in but no profile' : 'Not logged in');
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        console.log('Starting to load recommendations');
        console.log('User state:', {
          id: currentUser.uid,
          following: currentUser.profileData.following?.length || 0,
          favorites: currentUser.profileData.favorites?.length || 0
        });

        const recommendations = await getRecommendedSongs({
          userId: currentUser.uid,
          userProfile: currentUser.profileData
        });

        console.log('Setting recommendations state:', recommendations.length, 'songs');
        setRecommendedSongs(recommendations);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    if (currentUser) {
      console.log('User logged in, attempting to load recommendations');
      loadRecommendations();
    } else {
      console.log('No user logged in, skipping recommendations');
      setRecommendedSongs([]);
    }
  }, [currentUser]);

  // Get trending songs (most favorited in the last week)
  const trendingSongs = filteredSongs
    .sort((a, b) => getRecentFavoriteCount(b) - getRecentFavoriteCount(a))
    .slice(0, 20);

  return (
    <div className="p-6">
      {/* Trending This Week Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-white">Trending This Week</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="releasing"
                checked={showReleasingThisWeek}
                onCheckedChange={setShowReleasingThisWeek}
                className="data-[state=checked]:bg-purple-500"
              />
              <Label htmlFor="releasing" className="text-gray-200 font-medium">
                Releasing This Week
              </Label>
            </div>

            <Select
              value={selectedGenre}
              onValueChange={setSelectedGenre}
            >
              <SelectTrigger className="w-[180px] bg-[#1a1a1a] border-[#383838] focus:ring-purple-500 focus:ring-offset-0">
                <SelectValue placeholder="Select Genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {trendingSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trendingSongs.map((song) => (
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
          <div className="text-gray-400 text-center py-8">
            No songs available.
          </div>
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

