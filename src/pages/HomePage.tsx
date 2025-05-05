import React, { useState, useEffect } from "react";
import SongCard from "../components/song-card";
import MusicPlayer from "../components/MusicPlayer";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { toggleFavorite, updateExistingSongsWithGenre } from "../lib/firebase";
import { toast } from "sonner";
import { Song } from "../types/song";
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getRecommendedSongs } from '../lib/recommendations';
import { Music } from "lucide-react";
import { Button } from '../components/ui/button';

const GENRES = [
  "All",
  "Electronic",
  "Rap",
  "Pop",
  "Country",
  "Rock",
  "Other"
];

type ReleaseFilter = 'all_unreleased' | 'dated' | 'undated' | 'released';

interface HomePageProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  searchTerm: string;
}

const HomePage: React.FC<HomePageProps> = ({ songs, setSongs, searchTerm }) => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>("all_unreleased");
  const [showNextWeek, setShowNextWeek] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsLimit, setRecommendationsLimit] = useState(8);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!currentUser?.profileData) return;
      setIsLoadingRecommendations(true);
      try {
        const recommendations = await getRecommendedSongs({
          userId: currentUser.uid,
          userProfile: currentUser.profileData,
          limit: recommendationsLimit
        });
        // Filter out songs the user has already liked
        const filtered = recommendations.filter(song => !song.favorites || !song.favorites[currentUser.uid]);
        setRecommendedSongs(filtered);
      } catch (error) {
        console.error('Error loading recommendations:', error);
        toast.error('Failed to load recommendations');
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    loadRecommendations();
  }, [currentUser, recommendationsLimit]);

  const handleLoadMore = () => {
    setRecommendationsLimit(prev => prev + 8);
  };

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

  const isReleasingNextWeek = (song: Song): boolean => {
    const releaseDate = parseDate(song.releaseDate);
    if (!releaseDate) return false;
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return releaseDate > now && releaseDate <= nextWeek;
  };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const filteredSongs = songs
    .filter(song => song.verificationStatus !== 'pending')
    .filter(song => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        song.title.toLowerCase().includes(searchLower) ||
        song.artist.toLowerCase().includes(searchLower);

      // Genre filter
      const matchesGenre = selectedGenre === "All" || song.genre === selectedGenre;

      // Release filter
      const releaseDate = parseDate(song.releaseDate);
      let matchesReleaseFilter = true;

      switch (releaseFilter) {
        case 'all_unreleased':
          matchesReleaseFilter = !releaseDate || releaseDate > new Date();
          break;
        case 'dated':
          matchesReleaseFilter = releaseDate && releaseDate > new Date();
          break;
        case 'undated':
          matchesReleaseFilter = !releaseDate;
          break;
        case 'released':
          matchesReleaseFilter = releaseDate && releaseDate <= new Date();
          break;
        default:
          matchesReleaseFilter = true;
      }

      // Next 7 days filter
      if (showNextWeek) {
        return matchesSearch && matchesGenre && isReleasingNextWeek(song);
      }

      return matchesSearch && matchesGenre && matchesReleaseFilter;
    })
    .map(song => {
      // Calculate likes in the past week using favorites mapping
      const recentLikes = song.favorites
        ? Object.values(song.favorites).filter((ts: string) => {
            const likeDate = new Date(ts);
            return likeDate > oneWeekAgo;
          }).length
        : 0;
      // Debug log
      console.log('Song:', song.title, '| favorites:', song.favorites, '| recentLikes:', recentLikes);
      return { ...song, recentLikes };
    })
    .sort((a, b) => {
      // Sort by recentLikes (desc), then by nearest release date (asc)
      if ((b.recentLikes || 0) !== (a.recentLikes || 0)) {
        return (b.recentLikes || 0) - (a.recentLikes || 0);
      }
      const dateA = parseDate(a.releaseDate);
      const dateB = parseDate(b.releaseDate);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Recommended For You section is hidden for now */}

      {/* Trending/Filters section: only show if not searching */}
      {(!searchTerm || searchTerm.trim() === '') && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-purple-500" />
            <h2 className="text-2xl font-bold">Trending This Week</h2>
          </div>
          <div className="flex gap-4 items-center">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-[180px]">
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

            <Select value={releaseFilter} onValueChange={(value: ReleaseFilter) => setReleaseFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by release" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_unreleased">All Unreleased Songs</SelectItem>
                <SelectItem value="dated">Dated Songs</SelectItem>
                <SelectItem value="undated">Undated Songs</SelectItem>
                <SelectItem value="released">Released Songs</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                id="next-week"
                checked={showNextWeek}
                onCheckedChange={setShowNextWeek}
              />
              <Label htmlFor="next-week">Releasing in Next 7 Days</Label>
            </div>
          </div>
        </div>
      )}

      {/* Song Grid */}
      {searchTerm && searchTerm.trim() !== '' && (
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Search Results</h2>
        </div>
      )}
      {filteredSongs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            {searchTerm 
              ? 'No songs match your search'
              : releaseFilter !== 'all_unreleased'
                ? `No ${releaseFilter} songs found`
                : 'No songs available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onFavorite={async (songId) => {
                if (!currentUser) {
                  toast.error("Please login to favorite songs");
                  return;
                }

                try {
                  const isFavorited = await toggleFavorite(currentUser.uid, songId);
                  setSongs(prevSongs =>
                    prevSongs.map(s =>
                      s.id === songId
                        ? { ...s, isFavorite: isFavorited }
                        : s
                    )
                  );
                } catch (error) {
                  console.error("Error toggling favorite:", error);
                  toast.error("Failed to update favorite");
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;

