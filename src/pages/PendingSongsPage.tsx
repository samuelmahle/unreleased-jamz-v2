import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Song } from '@/types/song';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, increment, getDoc } from 'firebase/firestore';
import { db, autoVerifyExistingSongs, archiveSong } from '@/lib/firebase';
import { Music } from 'lucide-react';
import { toast } from 'sonner';
import SongCard from '@/components/song-card';
import { POINTS_REWARDS } from '@/types/user';
import { Button } from '@/components/ui/button';

const PendingSongsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
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
      toast.error('Please login to verify songs', {
        description: 'Create an account to help verify songs',
        action: {
          label: 'Login',
          onClick: () => navigate('/login')
        },
      });
      return;
    }

    setVoting(songId);
    try {
      const songRef = doc(db, 'songs', songId);
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Update Firebase
      await updateDoc(songRef, {
        upvotes: arrayUnion(currentUser.uid),
        downvotes: arrayRemove(currentUser.uid)
      });

      // Award points to the user who confirmed the song
      await updateDoc(userRef, {
        points: increment(POINTS_REWARDS.CONFIRM_SONG)
      });

      // Get the updated song data
      const songDoc = await getDoc(songRef);
      const songData = songDoc.data();
      if (songData) {
        const upvoteCount = (songData.upvotes?.length || 0);
        
        // If this is the 3rd upvote, award points to the uploader
        if (upvoteCount === 3) {
          const uploaderRef = doc(db, 'users', songData.userId);
          await updateDoc(uploaderRef, {
            points: increment(POINTS_REWARDS.UPLOAD_CONFIRMED)
          });
        }
      }

      // Update local state
      setSongs(prevSongs => 
        prevSongs.map(song => {
          if (song.id === songId) {
            const newUpvotes = Array.from(new Set([...song.upvotes, currentUser.uid]));
            const newDownvotes = song.downvotes.filter(id => id !== currentUser.uid);
            
            // If this upvote puts it at 3 upvotes, remove it from the list
            if (newUpvotes.length >= 3) {
              return null;
            }

            return {
              ...song,
              upvotes: newUpvotes,
              downvotes: newDownvotes
            };
          }
          return song;
        }).filter(Boolean) as Song[]
      );

      toast.success('Song upvoted successfully');
    } catch (error) {
      console.error('Error upvoting:', error);
      toast.error('Failed to upvote song');
    } finally {
      setVoting(null);
    }
  };

  const handleDownvote = async (songId: string) => {
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

    setVoting(songId);
    try {
      const songRef = doc(db, 'songs', songId);
      
      // Update Firebase
      await updateDoc(songRef, {
        downvotes: arrayUnion(currentUser.uid),
        upvotes: arrayRemove(currentUser.uid)
      });

      // Get updated song data to check net votes
      const songDoc = await getDoc(songRef);
      const songData = songDoc.data();
      if (songData) {
        const upvoteCount = songData.upvotes?.length || 0;
        const downvoteCount = songData.downvotes?.length || 0;
        const netVotes = upvoteCount - downvoteCount;

        // If net votes reach -3, archive the song
        if (netVotes <= -3) {
          await archiveSong(songId);
          toast.success('Song has been archived due to negative votes');
          // Remove song from the list
          setSongs(prevSongs => prevSongs.filter(s => s.id !== songId));
          return;
        }
      }

      // Update local state
      setSongs(prevSongs => 
        prevSongs.map(song => {
          if (song.id === songId) {
            const newDownvotes = Array.from(new Set([...song.downvotes, currentUser.uid]));
            const newUpvotes = song.upvotes.filter(id => id !== currentUser.uid);
            
            return {
              ...song,
              downvotes: newDownvotes,
              upvotes: newUpvotes
            };
          }
          return song;
        })
      );

      toast.success('Song downvoted successfully');
    } catch (error) {
      console.error('Error downvoting:', error);
      toast.error('Failed to downvote song');
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

      {songs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">No pending songs available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {songs.map((song) => (
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