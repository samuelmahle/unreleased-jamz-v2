import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Song } from '../types/song';
import { useAuth } from '../contexts/AuthContext';
import { useVerification } from '../contexts/VerificationContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Timestamp } from 'firebase/firestore';

const GENRES = [
  "Electronic",
  "Rap",
  "Pop",
  "Country",
  "Rock",
  "Other"
];

// Utility to parse releaseDate for the form
function getDateInputValue(date: any): string {
  if (!date) return '';
  if (date instanceof Timestamp) {
    return date.toDate().toISOString().split('T')[0];
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }
  return '';
}

const EditSongPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { editSong, proposeEdit, userVerification } = useVerification();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [song, setSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    genre: '',
    releaseDate: '',
    soundcloudUrl: '',
    notes: ''
  });

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;
      
      try {
        const songDoc = await getDoc(doc(db, 'songs', id));
        if (songDoc.exists()) {
          const songData = songDoc.data() as Song;
          setSong({ ...songData, id: songDoc.id });
          setFormData({
            title: songData.title || '',
            artist: songData.artist || '',
            genre: songData.genre || '',
            releaseDate: getDateInputValue(songData.releaseDate),
            soundcloudUrl: songData.soundcloudUrl || '',
            notes: ''
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

  useEffect(() => {
    // Check permissions and redirect if not allowed
    if (!isLoading && song && !canEditSong(song)) {
      toast.error('You do not have permission to edit this song');
      navigate(`/songs/${id}`);
    }
  }, [isLoading, song, id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song || !currentUser) return;

    if (!formData.notes.trim()) {
      toast.error('Please provide a comment about your edit request.');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        title: formData.title,
        artist: formData.artist,
        genre: formData.genre,
        releaseDate: formData.releaseDate ? new Date(formData.releaseDate) : null,
        soundcloudUrl: formData.soundcloudUrl || null
      };
      await proposeEdit(song.id, updates, formData.notes, {
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        releaseDate: song.releaseDate,
        soundcloudUrl: song.soundcloudUrl
      });
      toast.success('Edit proposal submitted for review');
      navigate(`/songs/${song.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit edit request');
    } finally {
      setIsSaving(false);
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

  const isVerifiedContributor = userVerification?.role === 'verified_contributor';

  const canEditSong = (song: Song) => {
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 hover:bg-gray-800"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="bg-music-surface rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Song</h1>
          {isVerifiedContributor && (
            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
              Changes will be reviewed by admin
            </Badge>
          )}
        </div>

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
            <Select
              value={formData.genre}
              onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
            >
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
            <Label htmlFor="soundcloudUrl">SoundCloud URL (optional)</Label>
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
            <Label htmlFor="notes">Edit Notes (required)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="bg-gray-800/50 border-gray-700"
              placeholder="Please explain your changes..."
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-music hover:bg-music-light"
            >
              {isSaving ? 'Saving...' : 'Submit for Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSongPage; 