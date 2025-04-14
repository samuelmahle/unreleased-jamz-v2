import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Song } from '@/types/song';
import { Heart, Share2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Timestamp } from 'firebase/firestore';

// Robust date handling utility
const getFormattedDate = (date: any): string => {
  if (!date) return 'Release date unknown';
  
  try {
    let parsedDate: Date;
    
    if (date instanceof Timestamp) {
      parsedDate = date.toDate();
    } else if (typeof date === 'string') {
      // Try parsing ISO string first
      parsedDate = new Date(date);
      
      // If that fails, try parsing as a timestamp number
      if (isNaN(parsedDate.getTime())) {
        const timestamp = parseInt(date, 10);
        if (!isNaN(timestamp)) {
          parsedDate = new Date(timestamp);
        }
      }
    } else if (typeof date === 'number') {
      parsedDate = new Date(date);
    } else {
      return 'Release date unknown';
    }

    if (isNaN(parsedDate.getTime())) {
      return 'Release date unknown';
    }

    return format(parsedDate, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Release date unknown';
  }
};

const SongPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const { currentUser, userFavorites } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;
      
      try {
        const songDoc = await getDoc(doc(db, 'songs', id));
        if (songDoc.exists()) {
          setSong({
            ...songDoc.data() as Song,
            id: songDoc.id,
            isFavorite: userFavorites.includes(songDoc.id)
          });
        } else {
          toast.error('Song not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching song:', error);
        toast.error('Error loading song');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [id, navigate, userFavorites]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music"></div>
      </div>
    );
  }

  if (!song) {
    return null;
  }

  const isValidSoundCloudUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.startsWith('https://soundcloud.com/') || url.startsWith('https://on.soundcloud.com/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 hover:bg-gray-800"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="bg-music-surface rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{song.title}</h1>
          <p className="text-lg text-gray-300">{song.artist}</p>
        </div>

        <div className="aspect-video mb-6">
          {song.soundcloudUrl && isValidSoundCloudUrl(song.soundcloudUrl) ? (
            <iframe
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
              className="rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
              <p className="text-gray-400">Link not available</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Heart
                className={`h-5 w-5 ${
                  song.isFavorite ? "fill-music-accent text-music-accent" : "text-gray-400"
                }`}
              />
              <span className="text-sm text-gray-400">
                {song.favoritedBy?.length || 0}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-800"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          
          <span className="text-sm text-gray-400">
            {song.releaseDate ? `Releasing ${getFormattedDate(song.releaseDate)}` : 'Release date unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SongPage; 