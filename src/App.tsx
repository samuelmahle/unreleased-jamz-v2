import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { Song } from "@/types/song";
import { fetchSongs } from "@/lib/fetchSongs";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/HomePage";
import FavoritesPage from "@/pages/FavoritesPage";
import UploadPage from "@/pages/UploadPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    const loadSongs = async () => {
      const fetched = await fetchSongs();
      setSongs(fetched);
    };
    loadSongs();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#121212]">
          <Navbar onSearch={handleSearch} />
          
          {/* Main content with padding for mobile navigation */}
          <main className="pt-16 lg:pl-64 min-h-screen pb-16 lg:pb-0">
            <div className="container mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<HomePage songs={songs} setSongs={setSongs} searchTerm={searchTerm} />} />
                <Route path="/favorites" element={<FavoritesPage songs={songs} searchTerm={searchTerm} />} />
                <Route path="/upload" element={<UploadPage onSongUpload={(song) => setSongs([...songs, song])} />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </div>
          </main>
          
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
