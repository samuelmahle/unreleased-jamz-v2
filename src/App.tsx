
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Song } from "@/types/song";

import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";

import Navbar from "./components/Navbar";
import sampleSongs from "./data/sampleSongs";

const queryClient = new QueryClient();

const App = () => {
  const [songs, setSongs] = useState<Song[]>(sampleSongs);
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSongUpload = (song: Song) => {
    setSongs((prevSongs) => [song, ...prevSongs]);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="flex">
              <Navbar onSearch={setSearchTerm} />
              <div className="ml-64 flex-1 p-6">
                <Routes>
                  <Route path="/" element={<HomePage songs={songs} setSongs={setSongs} searchTerm={searchTerm} />} />
                  <Route path="/library" element={<LibraryPage songs={songs} setSongs={setSongs} searchTerm={searchTerm} />} />
                  <Route path="/upload" element={<UploadPage onSongUpload={handleSongUpload} />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
