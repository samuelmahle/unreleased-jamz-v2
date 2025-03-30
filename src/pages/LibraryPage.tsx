
import React, { useState } from "react";
import SongCard from "@/components/SongCard";
import MusicPlayer from "@/components/MusicPlayer";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LibraryPageProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  searchTerm: string;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ songs, setSongs, searchTerm }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  // Filter songs based on search term
  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Favorite songs
  const favoriteSongs = filteredSongs.filter((song) => song.isFavorite);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  const toggleFavorite = (songId: string) => {
    setSongs((prevSongs) =>
      prevSongs.map((song) =>
        song.id === songId
          ? { ...song, isFavorite: !song.isFavorite }
          : song
      )
    );
    
    const song = songs.find((s) => s.id === songId);
    if (song) {
      toast({
        title: song.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `"${song.title}" by ${song.artist}`,
      });
    }
  };

  return (
    <div className="pt-6 pb-32">
      <h1 className="text-3xl font-bold mb-8">Your Library</h1>
      
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Tracks</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {filteredSongs.length === 0 ? (
            <div className="text-center py-20">
              {searchTerm ? (
                <>
                  <h2 className="text-xl font-medium mb-2">No songs found</h2>
                  <p className="text-muted-foreground">
                    No results for "{searchTerm}". Try a different search term.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-medium mb-2">Your library is empty</h2>
                  <p className="text-muted-foreground">
                    Upload tracks or discover new music to add to your library.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => playSong(song)}
                  onFavorite={toggleFavorite}
                  isActive={currentSong?.id === song.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites">
          {favoriteSongs.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-xl font-medium mb-2">No favorite tracks yet</h2>
              <p className="text-muted-foreground">
                Add tracks to your favorites by clicking the heart icon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {favoriteSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => playSong(song)}
                  onFavorite={toggleFavorite}
                  isActive={currentSong?.id === song.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {currentSong && (
        <MusicPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </div>
  );
};

export default LibraryPage;
