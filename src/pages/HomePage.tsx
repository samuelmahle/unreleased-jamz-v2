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
import { getRecommendedSongs } from '@/lib/recommendations';
import { Music } from 'lucide-react';
import { Heart } from 'lucide-react';

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
  const [showUnreleased, setShowUnreleased] = useState(true);

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
      const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artists.some(artist => artist.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGenre = selectedGenre === "All" || song.genre === selectedGenre;
      const matchesReleaseFilter = showUnreleased || !song.isUnreleased;
      return matchesSearch && matchesGenre && matchesReleaseFilter;
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
    .slice(0, 10); // Show top 10 trending songs

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Trending This Week Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Music className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-white">Trending This Week</h2>
        </div>
        
        {trendingSongs.length > 0 ? (
          <div className="flex overflow-x-auto space-x-4 pb-4 -mx-2 px-2">
            {trendingSongs.map((song) => (
              <div 
                key={song.id} 
                className="flex-none w-[300px] bg-[#1a1a1a] rounded-lg overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{song.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-gray-400">
                      {song.artists.join(', ')}
                    </p>
                    <span className="px-2 py-0.5 text-xs bg-[#282828] rounded-full text-gray-300">
                      {song.genre}
                    </span>
                  </div>
                  
                  {/* SoundCloud Preview */}
                  <div className="relative aspect-[16/9] bg-[#282828] rounded-md mb-3">
                    {song.soundCloudUrl ? (
                      <iframe
                        src={`${song.soundCloudUrl}&color=%23FF5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay"
                        className="absolute inset-0 w-full h-full rounded-md"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        Preview not available
                      </div>
                    )}
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFavorite(song.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Heart
                          className={`h-5 w-5 ${song.isFavorite ? 'fill-purple-500 text-purple-500' : ''}`}
                        />
                      </button>
                      <span className="text-sm text-gray-400">
                        {song.favoritedBy?.length || 0}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {song.releaseDate ? (
                        isReleasingThisWeek(song.releaseDate) ? 
                          'Release date unknown' : 
                          new Date(song.releaseDate).toLocaleDateString('en-US', { 
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                      ) : 'Release date unknown'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            No songs available.
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-4 mb-6">
        <Select
          value={selectedGenre}
          onValueChange={setSelectedGenre}
        >
          <SelectTrigger className="w-[180px] bg-[#282828] border-none">
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

        <div className="flex items-center space-x-2">
          <Switch
            id="unreleased"
            checked={showUnreleased}
            onCheckedChange={setShowUnreleased}
          />
          <Label htmlFor="unreleased">Show Unreleased</Label>
        </div>
      </div>

      {/* All Songs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSongs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            onPlay={() => playSong(song)}
            onToggleFavorite={() => handleToggleFavorite(song.id)}
            isPlaying={currentSong?.id === song.id && isPlaying}
            isFavorite={song.isFavorite}
          />
        ))}
      </div>

      {currentSong && (
        <MusicPlayer
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </div>
  );
};

export default HomePage;
