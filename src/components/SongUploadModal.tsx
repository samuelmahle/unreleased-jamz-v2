import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { uploadSong } from '@/lib/songs';
import { toast } from 'sonner';
import { Song } from '@/types/song';

interface SongUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

const SongUploadModal: React.FC<SongUploadModalProps> = ({ isOpen, onClose, setSongs }) => {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState<Date | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setGenre('');
    setReleaseDate(null);
    setAudioFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      if (!currentUser) throw new Error('User not authenticated');
      if (!audioFile || !title || !artist) throw new Error('Missing required fields');

      const newSong = await uploadSong({
        file: audioFile,
        title,
        artist,
        genre,
        releaseDate: releaseDate || new Date(),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
      });

      // Add the new song to the songs list immediately
      setSongs(prevSongs => [newSong, ...prevSongs]);

      toast.success('Song uploaded successfully!');
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error uploading song:', error);
      toast.error('Failed to upload song', {
        description: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ... rest of the component code ...
} 