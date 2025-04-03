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

const SongPage: React.FC<SongPageProps> = ({ songs, hideMiniPlayer, playerState, setActiveSong }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    hideMiniPlayer();
  }, []);

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;

      try {
        const songDoc = await getDoc(doc(db, 'songs', id));
        if (songDoc.exists()) {
          const songData = { id: songDoc.id, ...songDoc.data() } as Song;
          setSong(songData);
          setActiveSong(songData);
          // Only auto-play if there's a valid SoundCloud URL
          if (songData.soundcloudUrl && isValidSoundCloudUrl(songData.soundcloudUrl)) {
            playerState.setIsPlaying(true);
          }
        } else {
          console.error('Song not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching song:', error);
        navigate('/');
      }
    };

    fetchSong();
  }, [id, navigate]);

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

  if (!song) {
    return <div className="px-4">Loading...</div>;
  }

  const isValidSoundCloudUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.startsWith('https://soundcloud.com/') || url.startsWith('https://on.soundcloud.com/');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white mb-4"
        >
          <ArrowLeft className="h-6 w-6 mr-2" />
          <span className="text-lg">Back</span>
        </button>
      </div>

      {/* Main content */}
      <div className="px-4">
        {/* Song title and artist */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{song.title}</h1>
          <p className="text-gray-400">{song.artist}</p>
        </div>

        {/* Original SoundCloud embed */}
        {song.soundcloudUrl && isValidSoundCloudUrl(song.soundcloudUrl) ? (
          <div className="mb-4">
            <iframe
              width="100%"
              height="180"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
              className="rounded-lg"
            />
          </div>
        ) : (
          <div className="w-full h-[180px] flex items-center justify-center bg-gray-800 rounded-lg mb-4">
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

      {/* Hidden SoundCloud iframe for playback */}
      {song.soundcloudUrl && isValidSoundCloudUrl(song.soundcloudUrl) && (
        <iframe
          ref={playerState.playerRef}
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
          className="hidden"
          width="0"
          height="0"
          frameBorder="no"
          allow="autoplay"
        />
      )}

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