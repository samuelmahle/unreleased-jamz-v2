import React, { useState } from "react";
import SongCard from "@/components/song-card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { toggleFavorite } from "@/lib/firebase";
import { toast } from "sonner";
import { Song } from "@/types/song";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timestamp } from "firebase/firestore";

const GENRES = [
  "All",
  "Electronic",
  "Rap",
  "Pop",
  "Country",
  "Rock",
  "Other"
];

interface ArchivedPageProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  searchTerm: string;
}

const ArchivedPage: React.FC<ArchivedPageProps> = ({ songs = [], setSongs, searchTerm }) => {
  const { toast: uiToast } = useToast();
  const { currentUser, userFavorites = [] } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState("All");

  const parseDate = (date: any): Date | null => {
    if (!date) {
      console.log('No date provided');
      return null;
    }
    
    console.log('Attempting to parse date:', date, 'Type:', typeof date);
    
    try {
      if (date instanceof Timestamp) {
        console.log('Date is a Firestore Timestamp');
        return date.toDate();
      }
      
      if (typeof date === 'string') {
        // Handle "April 11, 2025" format
        if (date.includes(',')) {
          console.log('Parsing date with comma format:', date);
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            console.log('Successfully parsed comma format date:', parsed);
            return parsed;
          }
        }

        // Try parsing as ISO string
        const isoDate = new Date(date);
        if (!isNaN(isoDate.getTime())) {
          console.log('Successfully parsed as ISO date:', isoDate);
          return isoDate;
        }
        
        // Try parsing as timestamp
        const timestamp = parseInt(date, 10);
        if (!isNaN(timestamp)) {
          const dateFromTimestamp = new Date(timestamp);
          console.log('Successfully parsed as timestamp:', dateFromTimestamp);
          return dateFromTimestamp;
        }
      }
      
      if (typeof date === 'number') {
        const dateFromNumber = new Date(date);
        console.log('Successfully parsed number as date:', dateFromNumber);
        return dateFromNumber;
      }

      console.log('Failed to parse date with any method');
      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  const isArchived = (releaseDate: string | null): boolean => {
    if (!releaseDate) {
      console.log('No release date provided');
      return false;
    }
    
    console.log('\n--- Checking archive status ---');
    console.log('Song release date:', releaseDate);
    
    const parsedDate = parseDate(releaseDate);
    if (!parsedDate) {
      console.log('Failed to parse release date');
      return false;
    }
    
    const now = new Date();
    console.log('Parsed release date:', parsedDate.toISOString());
    console.log('Current date:', now.toISOString());
    console.log('Is archived?', parsedDate < now);
    console.log('-------------------------\n');
    
    return parsedDate < now;
  };

  const sortedAndFilteredSongs = (songs || [])
    .filter(song => {
      console.log('Processing song:', song.title, 'Release date:', song.releaseDate);
      const matchesSearch = 
        song.title.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        song.artist.toLowerCase().includes((searchTerm || '').toLowerCase());
      
      const matchesGenre = selectedGenre === "All" || song.genre === selectedGenre;
      
      // Only show songs with past release dates
      const isArchivedSong = isArchived(song.releaseDate);
      console.log('Song:', song.title, 'Is archived:', isArchivedSong);
      
      return matchesSearch && matchesGenre && isArchivedSong;
    })
    .sort((a, b) => {
      // Sort by release date, most recent first
      const dateA = parseDate(a.releaseDate);
      const dateB = parseDate(b.releaseDate);
      
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime();
    });

  const handleToggleFavorite = async (songId: string) => {
    if (!currentUser) {
      toast.error("Please login to favorite songs");
      return;
    }
    
    const song = songs.find((s) => s.id === songId);
    if (!song) return;
    
    const newFavoriteStatus = !song.isFavorite;
    
    try {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Archived Songs</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select genre" />
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
      
      {sortedAndFilteredSongs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            {searchTerm 
              ? 'No archived songs match your search'
              : selectedGenre !== "All"
                ? `No archived ${selectedGenre} songs available`
                : 'No archived songs available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedAndFilteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isActive={false}
              onFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivedPage; 