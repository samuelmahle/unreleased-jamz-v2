import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Song } from '../types/song';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const GENRES = [
  "Electronic",
  "Rap",
  "Pop",
  "Country",
  "Rock",
  "Other"
];

const SuggestEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [song, setSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    genre: '',
    releaseDate: '',
    soundcloudUrl: '',
    reason: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;
      
      try {
        const songDoc = await getDoc(doc(db, 'songs', id));
        if (songDoc.exists()) {
          const songData = songDoc.data() as Song;
          setSong(songData);
          setFormData({
            title: songData.title,
            artist: songData.artist,
            genre: songData.genre,
            releaseDate: songData.releaseDate ? new Date(songData.releaseDate).toISOString().split('T')[0] : '',
            soundcloudUrl: songData.soundcloudUrl || '',
            reason: ''
          });
        } else {
          toast.error('Song not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching song:', error);
        toast.error('Error loading song');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !song) return;

    try {
      // Create edit suggestion
      await addDoc(collection(db, 'editSuggestions'), {
        songId: id,
        originalSong: {
          title: song.title,
          artist: song.artist,
          genre: song.genre,
          releaseDate: song.releaseDate,
          soundcloudUrl: song.soundcloudUrl
        },
        suggestedChanges: {
          title: formData.title,
          artist: formData.artist,
          genre: formData.genre,
          releaseDate: formData.releaseDate ? new Date(formData.releaseDate).toISOString() : null,
          soundcloudUrl: formData.soundcloudUrl
        },
        reason: formData.reason,
        status: 'pending',
        submittedBy: currentUser.uid,
        submittedAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null
      });

      toast.success('Edit suggestion submitted successfully');
      navigate(`/song/${id}`);
    } catch (error) {
      console.error('Error submitting edit suggestion:', error);
      toast.error('Failed to submit edit suggestion');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music"></div>
      </div>
    );
  }

  if (!song) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 hover:bg-gray-800"
        onClick={() => navigate(`/song/${id}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="bg-music-surface rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Song</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="bg-gray-800/50 border-gray-700"
              required
            />
          </div>

          <div>
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              className="bg-gray-800/50 border-gray-700"
              required
            />
          </div>

          <div>
            <Label htmlFor="genre">Genre</Label>
            <Select value={formData.genre} onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="releaseDate">Release Date</Label>
            <Input
              id="releaseDate"
              name="releaseDate"
              type="date"
              value={formData.releaseDate}
              onChange={handleInputChange}
              className="bg-gray-800/50 border-gray-700"
            />
          </div>

          <div>
            <Label htmlFor="soundcloudUrl">SoundCloud URL</Label>
            <Input
              id="soundcloudUrl"
              name="soundcloudUrl"
              value={formData.soundcloudUrl}
              onChange={handleInputChange}
              className="bg-gray-800/50 border-gray-700"
              placeholder="https://soundcloud.com/..."
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason for Changes</Label>
            <Textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="bg-gray-800/50 border-gray-700"
              placeholder="Please explain why these changes are needed (required for review)..."
              required
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/song/${id}`)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Submit for Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestEditPage; 