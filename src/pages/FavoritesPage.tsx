import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Song } from '@/types/song';
import SongCard from '@/components/song-card';
import { toggleFavorite } from '@/lib/firebase';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Timestamp } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FavoritesPageProps {
  songs: Song[];
  searchTerm: string;
}

type ReleaseFilter = 'all' | 'upcoming' | 'undated' | 'released';

const FavoritesPage: React.FC<FavoritesPageProps> = ({ songs, searchTerm }) => {
  const { currentUser, userFavorites } = useAuth();
  const navigate = useNavigate();
  const [activeSong, setActiveSong] = useState<string | null>(null);
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

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

  const filteredSongs = songs
    .filter(song => song.isFavorite)
    .filter(song => song.verificationStatus !== 'pending') // Show all songs that have been confirmed
    .filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artists.some(artist => artist.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (selectedStatus === "all") return matchesSearch;
      if (selectedStatus === "released") return matchesSearch && !song.isUnreleased;
      if (selectedStatus === "unreleased") return matchesSearch && song.isUnreleased;
      
      return matchesSearch;
    });

  // Filter and sort songs based on release status
  const now = new Date();
  const filteredSongsBasedOnRelease = filteredSongs
    .filter(song => {
      const releaseDate = parseDate(song.releaseDate);
      
      switch (releaseFilter) {
        case 'upcoming':
          return releaseDate && releaseDate > now;
        case 'undated':
          return !releaseDate;
        case 'released':
          return releaseDate && releaseDate <= now;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      const dateA = parseDate(a.releaseDate);
      const dateB = parseDate(b.releaseDate);

      // If both dates are null, maintain original order
      if (!dateA && !dateB) return 0;
      // If only one date is null, put it at the end
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      // For upcoming releases, sort by nearest first
      if (dateA > now && dateB > now) {
        return dateA.getTime() - dateB.getTime();
      }
      // For released songs, sort by most recent first
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Favorites</h1>
        <Select value={releaseFilter} onValueChange={(value: ReleaseFilter) => setReleaseFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by release" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Songs</SelectItem>
            <SelectItem value="upcoming">Upcoming Releases</SelectItem>
            <SelectItem value="undated">Undated Releases</SelectItem>
            <SelectItem value="released">Released Songs</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredSongsBasedOnRelease.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            {searchTerm 
              ? 'No favorite songs match your search'
              : releaseFilter !== 'all'
                ? `No ${releaseFilter} songs in your favorites`
                : 'No favorite songs yet. Start adding some!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredSongsBasedOnRelease.map((song) => (
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