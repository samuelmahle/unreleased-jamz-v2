import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where, setDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { searchSoundCloudTracks } from '../lib/soundcloud';
import { Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GENRES = [
  "Electronic",
  "Rap",
  "Pop",
  "Country",
  "Rock",
  "Other"
];

interface UploadPageProps {
  onSongUpload?: (song: any) => void;
}

export default function UploadPage({ onSongUpload }: UploadPageProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [artists, setArtists] = useState(['']); // Initialize with one empty artist input
  const [genre, setGenre] = useState('Electronic');
  const [releaseDate, setReleaseDate] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleArtistChange = (index: number, value: string) => {
    const newArtists = [...artists];
    newArtists[index] = value;
    setArtists(newArtists);
  };

  const addArtist = () => {
    setArtists([...artists, '']);
  };

  const removeArtist = (index: number) => {
    if (artists.length > 1) {
      const newArtists = artists.filter((_, i) => i !== index);
      setArtists(newArtists);
    }
  };

  const handleSearch = async () => {
    if (!title || !artists[0]) {
      toast.error('Please enter both title and artist name(s)');
      return;
    }

    // Use the first artist for SoundCloud search
    const primaryArtist = artists[0].trim();
    setLoadingMatches(true);
    setMatches([]);
    
    try {
      const results = await searchSoundCloudTracks(primaryArtist, title);
      setMatches(results);
      if (results.length === 0) {
        toast.error('No matching tracks found on SoundCloud');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search SoundCloud tracks');
    } finally {
      setLoadingMatches(false);
    }
  };

  const createArtistProfile = async (artistName: string) => {
    try {
      // Check if artist already exists
      const artistsQuery = query(
        collection(db, 'users'),
        where('username', '==', artistName),
        where('isArtist', '==', true)
      );
      const existingArtists = await getDocs(artistsQuery);
      
      if (!existingArtists.empty) {
        // Return existing artist's ID
        return existingArtists.docs[0].id;
      }

      // Create new artist profile
      const artistId = doc(collection(db, 'users')).id; // Generate new ID
      await setDoc(doc(db, 'users', artistId), {
        username: artistName,
        email: `${artistName.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`,
        isPublic: true,
        uploadCount: 0,
        createdAt: new Date().toISOString(),
        isArtist: true,
        isVerified: false,
        bio: `Music by ${artistName}`,
        followers: [],
        following: []
      });

      return artistId;
    } catch (error) {
      console.error('Error creating artist profile:', error);
      throw error;
    }
  };

  const checkForDuplicates = async (title: string, artists: string[]) => {
    try {
      // Get all songs with the same title
      const songsQuery = query(
        collection(db, 'songs'),
        where('title', '==', title)
      );
      const existingSongs = await getDocs(songsQuery);
      
      // Check if any of these songs have at least one matching artist
      for (const doc of existingSongs.docs) {
        const songData = doc.data();
        const songArtists = songData.artists || [songData.artist];
        
        // Check if any artist matches
        const hasMatchingArtist = artists.some(artist => 
          songArtists.some(existingArtist => 
            existingArtist.toLowerCase().trim() === artist.toLowerCase().trim()
          )
        );

        if (hasMatchingArtist) {
          return true; // Found a duplicate
        }
      }
      
      return false; // No duplicates found
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = customUrl || selectedUrl;
    
    // Filter out empty artists and trim whitespace
    const validArtists = artists.map(a => a.trim()).filter(a => a !== '');
    
    if (!title || validArtists.length === 0) {
      toast.error('Please fill in required fields (title and at least one artist)');
      return;
    }

    try {
      // Check for duplicates before proceeding
      const isDuplicate = await checkForDuplicates(title, validArtists);
      if (isDuplicate) {
        toast.error('A song with this title and artist already exists');
        return;
      }

      // Create or get artist profiles and collect their IDs
      const artistIds = await Promise.all(validArtists.map(createArtistProfile));

      const songRef = await addDoc(collection(db, 'songs'), {
        title,
        artist: validArtists[0], // Keep primary artist for backward compatibility
        artists: validArtists, // Add all artists
        artistIds, // Add all artist IDs
        genre,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        soundcloudUrl: finalUrl || null,
        createdAt: serverTimestamp(),
        favoritedBy: [],
        favoritedAt: [],
        favoriteCount: 0,
        userId: artistIds[0], // Primary artist's ID
        verificationStatus: 'pending',
        confirmations: 0,
        confirmedBy: [],
        confirmedAt: [],
        reports: 0,
        reportedBy: [],
        submittedBy: currentUser.uid,
        submittedAt: new Date(),
        version: 1,
        updatedAt: new Date().toISOString(),
        isHidden: false,
      });

      // Create the new song object with all necessary fields
      const newSong = {
        id: songRef.id,
        title,
        artist: validArtists[0],
        artists: validArtists,
        artistIds,
        genre,
        releaseDate: releaseDate || null,
        soundcloudUrl: finalUrl || null,
        createdAt: new Date().toISOString(),
        favoritedBy: [],
        favoritedAt: [],
        favoriteCount: 0,
        isFavorite: false,
        userId: artistIds[0], // Primary artist's ID
        verificationStatus: 'pending',
        confirmations: 0,
        confirmedBy: [],
        confirmedAt: [],
        reports: 0,
        reportedBy: [],
        submittedBy: currentUser.uid,
        submittedAt: new Date(),
        version: 1,
        updatedAt: new Date().toISOString(),
        isHidden: false,
      };

      // Increment upload count for all artists
      await Promise.all(artistIds.map(async (artistId) => {
        const artistRef = doc(db, 'users', artistId);
        await updateDoc(artistRef, {
          uploadCount: increment(1)
        });
      }));

      if (onSongUpload) {
        onSongUpload(newSong);
      }

      setSubmitted(true);
      toast.success('Song uploaded successfully!');
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Error uploading song:', error);
      toast.error('Failed to upload song');
    }
  };

  if (submitted) {
    return <div className="p-4 text-green-600 font-semibold">✅ Song uploaded successfully! Redirecting...</div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Upload Song</h1>
          
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm sm:text-base font-medium text-white">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-music"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm sm:text-base font-medium text-white">
              Artists <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {artists.map((artist, index) => (
                <div key={index} className="flex gap-2">
            <input
              type="text"
              value={artist}
                    onChange={(e) => handleArtistChange(index, e.target.value)}
                    placeholder={index === 0 ? "Primary Artist" : `Additional Artist ${index}`}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-music"
                    required={index === 0}
            />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeArtist(index)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addArtist}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Additional Artist
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="genre" className="block text-sm sm:text-base font-medium text-white">
              Genre <span className="text-red-500">*</span>
            </label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="releaseDate" className="block text-sm sm:text-base font-medium text-white">
              Release Date (optional)
            </label>
            <input
              type="date"
              id="releaseDate"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-music"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customUrl" className="block text-sm sm:text-base font-medium text-white">
              SoundCloud URL (optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                id="customUrl"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Enter SoundCloud URL"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-music"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={loadingMatches || (!title && !artists[0])}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
              >
                Check SoundCloud Matches
              </button>
            </div>
          </div>
        </div>

        {loadingMatches && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music mx-auto"></div>
            <p className="text-white mt-2 text-sm sm:text-base">Searching SoundCloud...</p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">SoundCloud Matches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.map((track) => (
                <div
                  key={track.id}
                  className={`p-4 rounded-lg cursor-pointer ${
                    selectedUrl === track.permalink_url
                      ? 'bg-music bg-opacity-20 border-2 border-music'
                      : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => {
                    setSelectedUrl(track.permalink_url);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {track.artwork_url && (
                      <img
                        src={track.artwork_url}
                        alt={track.title}
                        className="w-16 h-16 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-medium text-white truncate">
                        {track.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">
                        {track.user.username}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(track.duration / 1000 / 60)}:{String(
                          Math.round((track.duration / 1000) % 60)
                        ).padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitted}
          className="w-full px-4 py-2 bg-music text-white rounded-md hover:bg-music-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
        >
          {submitted ? 'Uploading...' : 'Upload Track'}
        </button>
      </form>
    </div>
  );
}
