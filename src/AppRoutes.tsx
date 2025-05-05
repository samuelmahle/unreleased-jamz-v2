import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Song } from "@/types/song";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toggleFavorite } from '@/lib/firebase';
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/HomePage";
import FavoritesPage from "@/pages/FavoritesPage";
import UploadPage from "@/pages/UploadPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import SongPage from "@/pages/SongPage";
import ArchivedPage from "@/pages/ArchivedPage";
import ArtistPage from '@/pages/ArtistPage';
import ArtistsPage from '@/pages/ArtistsPage';
import AboutPage from '@/pages/AboutPage';
import PendingSongsPage from '@/pages/PendingSongsPage';
import ReportsPage from '@/pages/ReportsPage';
import { VerificationProvider } from '@/contexts/VerificationContext';
import { AdminProvider } from '@/contexts/AdminContext';
import EditSongPage from '@/pages/EditSongPage';
import SuggestEditPage from '@/pages/SuggestEditPage';
import EditSuggestionsPage from '@/pages/EditSuggestionsPage';
import { Timestamp } from 'firebase/firestore';

function AppRoutes() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchSongs = async () => {
      const snapshot = await getDocs(collection(db, 'songs'));
      const fetchedSongs = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Firestore song data:', data); // Debug log
        return {
          id: doc.id,
          title: data.title || '',
          artist: data.artist || '',
          genre: data.genre || 'Electronic',
          releaseDate: data.releaseDate || null,
          soundcloudUrl: data.soundcloudUrl || null,
          userId: data.userId || '',
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
          favorites: data.favorites || {},
          isFavorite: currentUser ? Object.keys(data.favorites || {}).includes(currentUser.uid) : false,
          verificationStatus: data.verificationStatus || 'pending',
          verifiedBy: data.verifiedBy || [],
          reportedBy: data.reportedBy || [],
          upvotedBy: data.upvotedBy || [],
          downvotedBy: data.downvotedBy || [],
          upvotes: data.upvotes || 0,
          downvotes: data.downvotes || 0
        } as Song;
      });
      setSongs(fetchedSongs);
    };

    fetchSongs();
  }, [currentUser]);

  const handleToggleFavorite = async (songId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to favorite songs');
      return;
    }

    try {
      const isFavorited = await toggleFavorite(currentUser.uid, songId);
      setSongs(prevSongs =>
        prevSongs.map(song =>
          song.id === songId
            ? { ...song, isFavorite: isFavorited }
            : song
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  return (
    <AdminProvider>
      <VerificationProvider>
        <Navbar onSearch={setSearchTerm} />
        
        {/* Main content with padding for mobile navigation */}
        <main className="pt-16 lg:pl-64 min-h-screen pb-16 lg:pb-0">
          <div className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={
                <HomePage
                  songs={songs}
                  setSongs={setSongs}
                  searchTerm={searchTerm}
                />
              } />
              <Route path="/favorites" element={
                <FavoritesPage
                  songs={songs}
                  searchTerm={searchTerm}
                />
              } />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/song/:id" element={<SongPage />} />
              <Route path="/songs/:id/edit" element={<EditSongPage />} />
              <Route path="/songs/:id/suggest-edit" element={<SuggestEditPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pending" element={<PendingSongsPage songs={songs} searchTerm={searchTerm} />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/edit-suggestions" element={<EditSuggestionsPage />} />
              <Route path="/artists/:id" element={<ArtistPage onFavorite={handleToggleFavorite} />} />
            </Routes>
          </div>
        </main>
      </VerificationProvider>
    </AdminProvider>
  );
}

export default AppRoutes; 