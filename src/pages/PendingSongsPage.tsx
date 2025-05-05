import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Song } from '@/types/song';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, increment, getDoc } from 'firebase/firestore';
import { db, autoVerifyExistingSongs, archiveSong, upvoteSong, downvoteSong } from '@/lib/firebase';
import { Music } from 'lucide-react';
import { toast } from 'sonner';
import SongCard from '@/components/song-card';
import { POINTS_REWARDS } from '@/types/user';
import { Button } from '@/components/ui/button';

const PendingSongsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingSongs = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'songs'));
      const songs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Song))
        .filter(song => song.verificationStatus === 'pending');
      setPendingSongs(songs);
      setLoading(false);
    };
    fetchPendingSongs();
  }, []);

  const handleUpvote = async (songId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to vote');
      return;
    }

    setVoting(songId);
    try {
      await upvoteSong(songId, currentUser.uid);
      const updatedDoc = await getDoc(doc(db, 'songs', songId));
      const updatedSong = { id: updatedDoc.id, ...updatedDoc.data() } as Song;
      setPendingSongs(prevSongs =>
        updatedSong.verificationStatus === 'verified'
          ? prevSongs.filter(song => song.id !== songId)
          : prevSongs.map(song => song.id === songId ? updatedSong : song)
      );
      toast.success('Upvoted successfully');
    } catch (error) {
      console.error('Error upvoting:', error);
      toast.error('Failed to upvote');
    } finally {
      setVoting(null);
    }
  };

  const handleDownvote = async (songId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to vote');
      return;
    }

    setVoting(songId);
    try {
      await downvoteSong(songId, currentUser.uid);
      const updatedDoc = await getDoc(doc(db, 'songs', songId));
      const updatedSong = { id: updatedDoc.id, ...updatedDoc.data() } as Song;
      setPendingSongs(prevSongs =>
        updatedSong.verificationStatus === 'verified'
          ? prevSongs.filter(song => song.id !== songId)
          : prevSongs.map(song => song.id === songId ? updatedSong : song)
      );
      toast.success('Downvoted successfully');
    } catch (error) {
      console.error('Error downvoting:', error);
      toast.error('Failed to downvote');
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Music className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-white">Loading Pending Songs...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-white">Pending Songs</h2>
          <p className="text-gray-400 text-sm ml-4">Help verify new songs by upvoting or downvoting them</p>
        </div>
        
        {currentUser?.email === 'sam18mahle@gmail.com' && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await autoVerifyExistingSongs();
                toast.success('All songs have been verified');
                // Refresh the page to show updated state
                window.location.reload();
              } catch (error) {
                console.error('Error verifying songs:', error);
                toast.error('Failed to verify songs');
              }
            }}
          >
            Verify All Songs
          </Button>
        )}
      </div>

      {pendingSongs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">No pending songs available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pendingSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              showVerificationStatus={true}
              onUpvote={handleUpvote}
              onDownvote={handleDownvote}
              isActive={voting === song.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingSongsPage; 