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

interface PendingSongsPageProps {
  songs: Song[];
  searchTerm: string;
}

const PendingSongsPage: React.FC<PendingSongsPageProps> = ({ songs, searchTerm }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [songsState, setSongs] = useState<Song[]>(songs);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingSongs = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'songs'));
        const fetchedSongs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            upvotes: Array.isArray(data.upvotes) ? data.upvotes : [],
            downvotes: Array.isArray(data.downvotes) ? data.downvotes : []
          } as Song;
        });

        // Filter for pending songs (less than 3 upvotes and not archived)
        const pendingSongs = fetchedSongs.filter(song => {
          const upvoteCount = song.upvotes?.length || 0;
          return upvoteCount < 3 && !song.isArchived;
        });

        setSongs(pendingSongs);
      } catch (error) {
        console.error('Error fetching pending songs:', error);
        toast.error('Failed to load pending songs');
      } finally {
        setLoading(false);
      }
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
      setSongs(prevSongs =>
        prevSongs.map(song =>
          song.id === songId
            ? {
                ...song,
                upvotes: (song.upvotes || 0) + 1,
                upvotedBy: [...(song.upvotedBy || []), currentUser.uid]
              }
            : song
        )
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
      setSongs(prevSongs =>
        prevSongs.map(song =>
          song.id === songId
            ? {
                ...song,
                downvotes: (song.downvotes || 0) + 1,
                downvotedBy: [...(song.downvotedBy || []), currentUser.uid]
              }
            : song
        )
      );
      toast.success('Downvoted successfully');
    } catch (error) {
      console.error('Error downvoting:', error);
      toast.error('Failed to downvote');
    } finally {
      setVoting(null);
    }
  };

  const filteredSongs = songsState.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch && song.verificationStatus === 'pending';
  });

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

      {filteredSongs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">No pending songs available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSongs.map((song) => (
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