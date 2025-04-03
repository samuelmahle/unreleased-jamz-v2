import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import FavoritesPage from "@/pages/FavoritesPage";
import UploadPage from "@/pages/UploadPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import SongPage from "@/pages/SongPage";
import NowPlayingBar from "@/components/NowPlayingBar";
import Navbar from "@/components/Navbar";
import { Song } from "@/types/song";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BottomNav from '@/components/BottomNav';

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [showMiniPlayer, setShowMiniPlayer] = useState(true);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);

  // Reset player state when song changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentPosition(0);
    setDuration(0);
    if (widgetRef.current) {
      widgetRef.current = null;
    }
  }, [activeSong]);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const songsSnapshot = await getDocs(collection(db, "songs"));
        const fetchedSongs = songsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Song));
        setSongs(fetchedSongs);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };

    fetchSongs();
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/song/')) {
      setShowMiniPlayer(true);
    }
  }, [location]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSongClick = (song: Song) => {
    console.log('App: handleSongClick called with song:', song);
    try {
      // Always set the active song first
      if (!activeSong || activeSong.id !== song.id) {
        console.log('App: Setting new active song');
        setActiveSong(song);
        // When changing songs, we want to start playing
        setIsPlaying(true);
        // Navigate to song page
        console.log('App: Navigating to song page');
        navigate(`/song/${song.id}`);
      } else {
        console.log('App: Same song clicked, toggling play/pause');
        // If it's the same song, toggle play/pause
        if (isPlaying) {
          handlePause();
        } else {
          handlePlay();
        }
      }
    } catch (error) {
      console.error('App: Error handling song click:', error);
      toast.error('Unable to play song: An error occurred');
    }
  };

  const hideMiniPlayer = () => {
    setShowMiniPlayer(false);
  };

  const handlePlay = () => {
    if (!widgetRef.current) return;
    widgetRef.current.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!widgetRef.current) return;
    widgetRef.current.pause();
    setIsPlaying(false);
  };

  const handleSeek = (position: number) => {
    if (!widgetRef.current) return;
    widgetRef.current.seekTo(position);
    setCurrentPosition(position);
  };

  const handleNext = () => {
    if (!activeSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex(s => s.id === activeSong.id);
    if (currentIndex < songs.length - 1) {
      const nextSong = songs[currentIndex + 1];
      setActiveSong(nextSong);
      // When changing songs, we want to start playing
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    if (!activeSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex(s => s.id === activeSong.id);
    if (currentIndex > 0) {
      const previousSong = songs[currentIndex - 1];
      setActiveSong(previousSong);
      // When changing songs, we want to start playing
      setIsPlaying(true);
    }
  };

  const playerState = {
    isPlaying,
    currentPosition,
    duration,
    onPlay: handlePlay,
    onPause: handlePause,
    onSeek: handleSeek,
    onNext: handleNext,
    onPrevious: handlePrevious,
    playerRef,
    widgetRef,
    setIsPlaying,
    setCurrentPosition,
    setDuration
  };

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-music-dark text-white">
      <Navbar onSearch={handleSearch} />
      <main className="container mx-auto px-4 pt-16 pb-40">
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                songs={filteredSongs}
                searchTerm={searchTerm}
                onSongClick={handleSongClick}
                setSongs={setSongs}
              />
            } 
          />
          <Route 
            path="/favorites" 
            element={
              <FavoritesPage 
                songs={filteredSongs}
                searchTerm={searchTerm}
                onSongClick={handleSongClick}
                setSongs={setSongs}
              />
            } 
          />
          <Route path="/upload" element={<UploadPage onSongUpload={(song) => setSongs([...songs, song])} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route 
            path="/song/:id" 
            element={
              <SongPage 
                songs={songs}
                hideMiniPlayer={hideMiniPlayer}
                playerState={playerState}
                setActiveSong={setActiveSong}
              />
            } 
          />
        </Routes>
      </main>
      <BottomNav />
      {showMiniPlayer && activeSong && (
        <NowPlayingBar 
          song={activeSong}
          playerState={playerState}
        />
      )}
      <Toaster />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
