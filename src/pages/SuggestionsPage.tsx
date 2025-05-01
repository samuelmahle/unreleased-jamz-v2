import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Song } from '@/types/song';
import SongCard from '@/components/SongCard';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DOWNVOTE_REASONS = [
  { id: 'wrong_artist', label: 'Wrong Artist', description: 'The artist attribution is incorrect' },
  { id: 'fake_leak', label: 'Fake Leak', description: 'This is not a genuine unreleased track' },
  { id: 'duplicate', label: 'Duplicate Upload', description: 'This song has already been uploaded' },
  { id: 'wrong_title', label: 'Wrong Title', description: 'The song title is incorrect' },
  { id: 'low_quality', label: 'Low Quality', description: 'The audio quality is too poor' },
  { id: 'other', label: 'Other', description: 'Other issue not listed above' },
];

const SuggestionsPage = () => {
  const { currentUser, addPoints } = useAuth();
  const [unconfirmedSongs, setUnconfirmedSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isDownvoteDialogOpen, setIsDownvoteDialogOpen] = useState(false);
  const [selectedDownvoteReason, setSelectedDownvoteReason] = useState('');
  const [downvoteDetails, setDownvoteDetails] = useState('');

  useEffect(() => {
    const fetchUnconfirmedSongs = async () => {
      try {
        const q = query(
          collection(db, 'songs'),
          where('verificationStatus', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        const songs = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Song[];
        setUnconfirmedSongs(songs);
      } catch (error) {
        console.error('Error fetching unconfirmed songs:', error);
        toast.error('Failed to load songs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnconfirmedSongs();
  }, []);

  const handleUpvote = async (song: Song) => {
    if (!currentUser) {
      toast.error('Please login to vote');
      return;
    }

    try {
      const songRef = doc(db, 'songs', song.id);
      const songDoc = await getDoc(songRef);
      const songData = songDoc.data();
      
      // Remove any existing downvote
      const downvotedBy = songData?.downvotedBy?.filter((uid: string) => uid !== currentUser.uid) || [];
      const upvotedBy = songData?.upvotedBy || [];
      
      // Toggle upvote
      const hasUpvoted = upvotedBy.includes(currentUser.uid);
      const newUpvotedBy = hasUpvoted 
        ? upvotedBy.filter((uid: string) => uid !== currentUser.uid)
        : [...upvotedBy, currentUser.uid];
      
      const netVotes = newUpvotedBy.length - downvotedBy.length;
      const shouldVerify = netVotes >= 3;
      
      await updateDoc(songRef, {
        upvotedBy: newUpvotedBy,
        downvotedBy,
        upvotes: newUpvotedBy.length,
        downvotes: downvotedBy.length,
        verificationStatus: shouldVerify ? 'verified' : 'pending'
      });

      // Award points
      if (!hasUpvoted) {
        await addPoints(10);
      }
      
      // Update local state
      setUnconfirmedSongs(prev => 
        shouldVerify
          ? prev.filter(s => s.id !== song.id) // Remove verified songs
          : prev.map(s => 
              s.id === song.id 
                ? { ...s, upvotedBy: newUpvotedBy, downvotedBy, upvotes: newUpvotedBy.length, downvotes: downvotedBy.length }
                : s
            )
      );
      
      toast.success(hasUpvoted ? 'Upvote removed' : 'Song upvoted');
      if (shouldVerify) {
        toast.success('Song has been verified!');
        // Award points to the uploader
        const uploaderRef = doc(db, 'users', song.uploadedBy);
        await updateDoc(uploaderRef, {
          points: songData.points + 200
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upvote song');
    }
  };

  const handleDownvote = async () => {
    if (!currentUser || !selectedSong || !selectedDownvoteReason) {
      toast.error('Please select a reason for downvoting');
      return;
    }

    try {
      const songRef = doc(db, 'songs', selectedSong.id);
      const songDoc = await getDoc(songRef);
      const songData = songDoc.data();
      
      // Remove any existing upvote
      const upvotedBy = songData?.upvotedBy?.filter((uid: string) => uid !== currentUser.uid) || [];
      const downvotedBy = songData?.downvotedBy || [];
      
      // Add downvote if not already downvoted
      if (!downvotedBy.includes(currentUser.uid)) {
        downvotedBy.push(currentUser.uid);
      }

      // Add to admin dashboard
      const downvoteData = {
        songId: selectedSong.id,
        songTitle: selectedSong.title,
        userId: currentUser.uid,
        reason: selectedDownvoteReason,
        details: downvoteDetails.trim(),
        timestamp: new Date(),
      };
      
      await Promise.all([
        updateDoc(songRef, {
          upvotedBy,
          downvotedBy,
          upvotes: upvotedBy.length,
          downvotes: downvotedBy.length
        }),
        addDoc(collection(db, 'downvotes'), downvoteData)
      ]);
      
      // Update local state
      setUnconfirmedSongs(prev => 
        prev.map(s => 
          s.id === selectedSong.id 
            ? { ...s, upvotedBy, downvotedBy, upvotes: upvotedBy.length, downvotes: downvotedBy.length }
            : s
        )
      );
      
      setIsDownvoteDialogOpen(false);
      setSelectedDownvoteReason('');
      setDownvoteDetails('');
      setSelectedSong(null);
      toast.success('Song downvoted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to downvote song');
    }
  };

  const openDownvoteDialog = (song: Song) => {
    if (!currentUser) {
      toast.error('Please login to vote');
      return;
    }
    setSelectedSong(song);
    setIsDownvoteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Pending Songs</h1>
        </div>

        {unconfirmedSongs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400">No songs need confirmation at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unconfirmedSongs.map((song) => (
              <div key={song.id} className="relative group">
                <SongCard song={song} />
                <div className="absolute bottom-4 left-4 flex gap-2 p-1 rounded-lg bg-black/80 backdrop-blur-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      song.upvotedBy?.includes(currentUser?.uid || '')
                        ? 'text-green-500'
                        : 'text-gray-400 hover:text-green-500'
                    }`}
                    onClick={() => handleUpvote(song)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {song.upvotes || 0}
                  </Button>
                  <div className="w-px bg-gray-800" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      song.downvotedBy?.includes(currentUser?.uid || '')
                        ? 'text-red-500'
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    onClick={() => openDownvoteDialog(song)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    {song.downvotes || 0}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDownvoteDialogOpen} onOpenChange={setIsDownvoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              Downvote Song
            </DialogTitle>
            <DialogDescription>
              Please select a reason for downvoting this song. This will help moderators review the issue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <RadioGroup
              value={selectedDownvoteReason}
              onValueChange={setSelectedDownvoteReason}
              className="space-y-3"
            >
              {DOWNVOTE_REASONS.map((reason) => (
                <div key={reason.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-800/50">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label htmlFor={reason.id} className="grid gap-1 cursor-pointer">
                    <span className="font-medium">{reason.label}</span>
                    <span className="text-sm text-gray-400">{reason.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                value={downvoteDetails}
                onChange={(e) => setDownvoteDetails(e.target.value)}
                placeholder="Provide any additional context that might help with the review..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownvoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDownvote}
              disabled={!selectedDownvoteReason}
              className="bg-red-500 hover:bg-red-600"
            >
              Submit Downvote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuggestionsPage; 