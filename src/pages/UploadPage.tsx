import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { searchSoundCloudTracks } from '../lib/soundcloud';

interface UploadPageProps {
  onSongUpload?: (song: any) => void;
}

export default function UploadPage({ onSongUpload }: UploadPageProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSearch = async () => {
    if (!title || !artist) {
      toast.error('Please enter both title and artist name');
      return;
    }

    setLoadingMatches(true);
    setMatches([]);
    
    try {
      const results = await searchSoundCloudTracks(artist, title);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = customUrl || selectedUrl;
    if (!title || !artist) {
      toast.error('Please fill in required fields (title and artist)');
      return;
    }

    try {
      await addDoc(collection(db, 'songs'), {
        title,
        artist,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        soundcloudUrl: finalUrl || null,
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      toast.success('Song uploaded successfully!');
      setTimeout(() => navigate('/'), 1500);
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
            <label htmlFor="artist" className="block text-sm sm:text-base font-medium text-white">
              Artist <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-music"
              required
            />
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
                disabled={loadingMatches || (!title && !artist)}
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
