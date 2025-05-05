import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Song } from "../types/song";
import SongCard from "../components/song-card";
import { toast } from "sonner";
import { Music } from "lucide-react";
import { toggleFavorite } from "../lib/firebase";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";

interface TrendingThisWeekPageProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

// Utility to robustly parse all possible date formats
function parseReleaseDate(date: any): Date | null {
  if (!date) return null;
  if (typeof date === "object" && typeof date.toDate === "function") {
    // Firestore Timestamp or similar
    return date.toDate();
  }
  if (typeof date === "number") {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof date === "string") {
    // Try ISO first
    let d = new Date(date);
    if (!isNaN(d.getTime())) return d;
    // Try US format (e.g. Apr 10, 2025)
    const usFormat = Date.parse(date.replace(/(\d{1,2})(st|nd|rd|th)/, "$1"));
    if (!isNaN(usFormat)) return new Date(usFormat);
  }
  return null;
}

const GENRES = ["All", "Electronic", "Rap", "Pop", "Country", "Rock", "Other"];
type ReleaseFilter = 'all' | 'upcoming' | 'undated' | 'released';

const TrendingThisWeekPage: React.FC<TrendingThisWeekPageProps> = ({ songs, setSongs }) => {
  const { currentUser } = useAuth();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>("upcoming");

  useEffect(() => {
    const fetchTrendingSongs = async () => {
      setIsLoading(true);
      try {
        // Get the timestamp for 7 days ago
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Fetch all songs (or at least all with a release date)
        const songsRef = collection(db, "songs");
        const querySnapshot = await getDocs(songsRef);
        const fetchedSongs: Song[] = [];

        querySnapshot.forEach((doc) => {
          const songData = doc.data() as Song;
          const releaseDate = parseReleaseDate(songData.releaseDate);
          const now = new Date();
          const nowUTC = new Date(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds()
          );
          console.log('releaseDate:', releaseDate, 'now:', now, 'nowUTC:', nowUTC);
          // Only include songs with a future release date (UTC comparison)
          if (releaseDate && releaseDate.getTime() > nowUTC.getTime()) {
            const song = {
              ...songData,
              id: doc.id,
              isFavorite: currentUser ? Object.keys(songData.favorites || {}).includes(currentUser.uid) : false
            };

            // Check if the song has received likes in the past week
            const recentLikes = Object.entries(songData.favorites || {})
              .filter(([_, timestamp]) => new Date(timestamp) > oneWeekAgo)
              .length;

            if (recentLikes > 0) {
              fetchedSongs.push({ ...song, recentLikes });
            }
          }
        });

        // Sort by likes received in the past week (most to least)
        const sortedSongs = fetchedSongs.sort((a, b) => 
          (b.recentLikes || 0) - (a.recentLikes || 0)
        );

        setTrendingSongs(sortedSongs);
      } catch (error) {
        console.error("Error fetching trending songs:", error);
        toast.error("Failed to load trending songs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingSongs();
  }, [currentUser]);

  const handleFavorite = async (songId: string) => {
    if (!currentUser) {
      toast.error("Please login to favorite songs");
      return;
    }

    try {
      const isFavorited = await toggleFavorite(currentUser.uid, songId);
      
      // Update both the trending songs and the main songs list
      setTrendingSongs(prevSongs =>
        prevSongs.map(s =>
          s.id === songId
            ? { ...s, isFavorite: isFavorited }
            : s
        )
      );

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
  };

  const filteredTrendingSongs = trendingSongs.filter(song => {
    const releaseDate = parseReleaseDate(song.releaseDate);
    const now = new Date();
    switch (releaseFilter) {
      case 'upcoming':
        return releaseDate && releaseDate > now;
      case 'released':
        return releaseDate && releaseDate <= now;
      case 'undated':
        return !releaseDate;
      default:
        return true;
    }
  }).filter(song => {
    return selectedGenre === "All" || song.genre === selectedGenre;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <Music className="h-6 w-6 text-purple-500" />
        <h2 className="text-2xl font-bold">Trending This Week</h2>
      </div>

      <div className="flex gap-4 items-center mb-6">
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
            <SelectItem value="upcoming">All Unreleased Songs</SelectItem>
            <SelectItem value="all">All Songs</SelectItem>
            <SelectItem value="released">Released Songs</SelectItem>
            <SelectItem value="undated">Undated Releases</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTrendingSongs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            No trending songs found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTrendingSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onFavorite={() => handleFavorite(song.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingThisWeekPage; 