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

type ReleaseFilter = 'all_unreleased' | 'dated' | 'undated' | 'released';

const FavoritesPage: React.FC<FavoritesPageProps> = ({ songs, searchTerm }) => {
  const { currentUser, userFavorites } = useAuth();
  const navigate = useNavigate();
  const [activeSong, setActiveSong] = useState<string | null>(null);
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all_unreleased');
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const releaseFilterOptions = [
    { value: 'all_unreleased', label: 'All Unreleased Songs' },
    { value: 'dated', label: 'Dated Songs' },
    { value: 'undated', label: 'Undated Songs' },
    { value: 'released', label: 'Released Songs' },
  ];

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
      await toggleFavorite(currentUser.uid, songId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const filteredSongs = songs
    .filter(song => userFavorites?.includes(song.id))
    .filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.artists || []).some(artist => artist.toLowerCase().includes(searchTerm.toLowerCase()));
      
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
        case 'all_unreleased':
          return !releaseDate || releaseDate > now;
        case 'dated':
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Favorites</h1>
        <Select value={releaseFilter} onValueChange={(value: ReleaseFilter) => setReleaseFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by release" />
          </SelectTrigger>
          <SelectContent>
            {releaseFilterOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {filteredSongsBasedOnRelease.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            {searchTerm 
              ? 'No favorite songs match your search'
              : releaseFilter !== 'all_unreleased'
                ? `No ${releaseFilter} songs in your favorites`
                : 'No favorite songs yet. Start adding some!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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