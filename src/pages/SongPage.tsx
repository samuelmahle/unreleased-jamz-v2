import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Song } from '@/types/song';
import { Heart, Share2, ArrowLeft, Music } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import NowPlayingBar from '@/components/NowPlayingBar';

interface PlayerState {
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  playerRef: React.RefObject<HTMLIFrameElement>;
  widgetRef: React.MutableRefObject<any>;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
}

interface SongPageProps {
  songs: Song[];
  hideMiniPlayer: () => void;
  playerState: PlayerState;
  setActiveSong: (song: Song) => void;
}

const isValidSoundCloudUrl = (url: string | null): boolean => {
  if (!url) return false;
  return url.startsWith('https://soundcloud.com/') || url.startsWith('https://on.soundcloud.com/');
};

const SongPage: React.FC<SongPageProps> = ({ songs, hideMiniPlayer, playerState, setActiveSong }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hideMiniPlayer();
    
    const fetchSong = async () => {
      if (!id) {
        setError('No song ID provided');
        return;
      }

      try {
        const songRef = doc(db, 'songs', id);
        const songDoc = await getDoc(songRef);
        
        if (songDoc.exists()) {
          const songData = { 
            id: songDoc.id, 
            ...songDoc.data(),
            favoritedBy: songDoc.data().favoritedBy || [],
            favoritedAt: songDoc.data().favoritedAt || [],
            favoriteCount: songDoc.data().favoriteCount || 0,
            isFavorite: songDoc.data().isFavorite || false,
          } as Song;
          
          const requiredFields = ['title', 'artist', 'uploadDate', 'updatedAt'];
          const missingFields = requiredFields.filter(field => !songData[field]);
          
          if (missingFields.length > 0) {
            setError(`Song data is incomplete. Missing: ${missingFields.join(', ')}`);
            return;
          }

          setSong(songData);
          setActiveSong(songData);
        } else {
          setError('Song not found');
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error) {
        setError('Error loading song');
        setTimeout(() => navigate('/'), 2000);
      }
    };

    fetchSong();
  }, [id, navigate, setActiveSong, hideMiniPlayer]);

  const handlePrevious = () => {
    if (!song || songs.length === 0) return;
    
    const currentIndex = songs.findIndex(s => s.id === song.id);
    if (currentIndex > 0) {
      playerState.setIsPlaying(false);
      navigate(`/song/${songs[currentIndex - 1].id}`);
    }
  };

  const handleNext = () => {
    if (!song || songs.length === 0) return;
    
    const currentIndex = songs.findIndex(s => s.id === song.id);
    if (currentIndex < songs.length - 1) {
      playerState.setIsPlaying(false);
      navigate(`/song/${songs[currentIndex + 1].id}`);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleFavorite = () => {
    // Implementation of handleFavorite function
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">{error}</div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-white mb-4 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-6 w-6 mr-2" />
          <span className="text-lg">Back to Home</span>
        </button>
      </div>

      {/* Main content */}
      <div className="px-4">
        {/* Song title and artist */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{song.title}</h1>
          <p className="text-gray-400">{song.artist}</p>
        </div>

        {/* SoundCloud embed */}
        {song.soundcloudUrl && isValidSoundCloudUrl(song.soundcloudUrl) ? (
          <div className="mb-4 relative">
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <Music className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Playing in the bottom bar</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-w-16 aspect-h-9 flex items-center justify-center bg-gray-800 rounded-lg mb-4">
            <p className="text-gray-400">Link not available</p>
          </div>
        )}

        {/* Song metadata */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <button 
              onClick={handleFavorite}
              className="flex items-center space-x-2"
            >
              <Heart
                className={`h-6 w-6 ${
                  song.isFavorite ? "fill-music-accent text-music-accent" : "text-gray-400"
                }`}
              />
              <span className="text-sm text-gray-400">
                {song.favoritedBy?.length || 0}
              </span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-400"
            >
              <Share2 className="h-6 w-6" />
            </button>
          </div>
          <span className="text-sm text-gray-400">
            {song.releaseDate
              ? `Releasing ${formatDistanceToNow(new Date(song.releaseDate), { addSuffix: true })}`
              : 'Release date unknown'}
          </span>
        </div>
      </div>

      {/* Player */}
      <NowPlayingBar
        song={song}
        onPrevious={handlePrevious}
        onNext={handleNext}
        isFullScreen={true}
        playerState={playerState}
      />
    </div>
  );
};

export default SongPage; 