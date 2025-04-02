import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { searchSoundCloudTracks } from '../lib/soundcloud';

interface UploadPageProps {
  onSongUpload?: (song: any) => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onSongUpload }) => {
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Upload Track</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter song title"
            required
            className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Artist <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Enter artist name"
            required
            className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Release Date <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white border-gray-700"
          />
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSearch}
            disabled={!title || !artist || loadingMatches}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 border border-gray-700"
          >
            🔍 Check SoundCloud Matches
          </button>

          {loadingMatches && (
            <div className="text-gray-400">Searching SoundCloud...</div>
          )}

          {matches.length > 0 && !selectedUrl && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Top Matches:</h2>
              <div className="grid gap-4">
                {matches.map((track) => (
                  <div
                    key={track.id}
                    className="border rounded-lg p-4 space-y-2 bg-gray-800 border-gray-700"
                  >
                    <div>
                      <h3 className="font-medium text-white">{track.title}</h3>
                      <p className="text-sm text-gray-400">by {track.user.username}</p>
                    </div>
                    <iframe
                      width="100%"
                      height="120"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(track.permalink_url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUrl(track.permalink_url);
                      }}
                      className="w-full px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      Use This
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedUrl && matches.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Selected Track:</h2>
                <button
                  type="button"
                  onClick={() => setSelectedUrl('')}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Show All Matches
                </button>
              </div>
              <div className="border rounded-lg p-4 space-y-2 bg-gray-800 border-gray-700">
                {matches.map((track) => track.permalink_url === selectedUrl && (
                  <div key={track.id}>
                    <div>
                      <h3 className="font-medium text-white">{track.title}</h3>
                      <p className="text-sm text-gray-400">by {track.user.username}</p>
                    </div>
                    <iframe
                      width="100%"
                      height="120"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(track.permalink_url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                    />
                    <button
                      type="button"
                      className="w-full px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                    >
                      ✓ Selected
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              SoundCloud URL <span className="text-gray-400">(optional)</span>
            </label>
            <div className="space-y-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setSelectedUrl('');
                }}
                placeholder="https://soundcloud.com/..."
                className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white border-gray-700"
              />
              {customUrl && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUrl(customUrl);
                    }}
                    className={`w-full px-4 py-2 rounded-md ${
                      selectedUrl === customUrl
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {selectedUrl === customUrl ? '✓ Selected' : 'Use This'}
                  </button>
                  <div className="border rounded-lg p-4 mt-4 bg-gray-800 border-gray-700">
                    <h3 className="font-medium mb-2 text-white">Selected Song Preview:</h3>
                    <iframe
                      width="100%"
                      height="120"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(customUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!title || !artist}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          Upload Track
        </button>
      </form>
    </div>
  );
};

export default UploadPage;
