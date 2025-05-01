import React from 'react';
import { Song } from '../types/song';
import SongCard from '@/components/song-card';
import { Music } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVerification } from '../contexts/VerificationContext';
import { toast } from 'sonner';

interface PendingSongsPageProps {
  songs: Song[];
  searchTerm: string;
}

const PendingSongsPage: React.FC<PendingSongsPageProps> = ({ songs, searchTerm }) => {
  const { currentUser } = useAuth();
  const { upvoteVerification, downvoteVerification } = useVerification();

  // Filter pending songs and apply search
  const pendingSongs = songs
    .filter(song => song.verificationStatus === 'pending')
    .filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artists.some(artist => artist.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by newest first
      const dateA = new Date(a.createdAt || '');
      const dateB = new Date(b.createdAt || '');
      return dateB.getTime() - dateA.getTime();
    });

  const handleUpvote = async (songId: string) => {
    if (!currentUser) {
      toast.error('Please login to verify songs', {
        description: 'Create an account to help verify songs',
        action: {
          label: 'Login',
          onClick: () => navigate('/login')
        },
      });
      return;
    }

    try {
      await upvoteVerification(songId);
      toast.success('Song upvoted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upvote song');
    }
  };

  const handleDownvote = async (songId: string) => {
    if (!currentUser) {
      toast.error('Please login to verify songs');
      return;
    }

    try {
      await downvoteVerification(songId);
      toast.success('Song downvoted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to downvote song');
    }
  };

  return (
    <div className="p-6">
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Music className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-white">Pending Songs</h2>
          <p className="text-gray-400 text-sm ml-4">Help verify new songs by upvoting or downvoting them</p>
        </div>

        {pendingSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pendingSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                showVerificationStatus
                onUpvote={() => handleUpvote(song.id)}
                onDownvote={() => handleDownvote(song.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            No pending songs available.
          </div>
        )}
      </section>
    </div>
  );
};

export default PendingSongsPage; 