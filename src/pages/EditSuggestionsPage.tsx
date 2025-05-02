import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from '../components/ui/textarea';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface EditSuggestion {
  id: string;
  songId: string;
  originalSong: {
    title: string;
    artist: string;
    genre: string;
    releaseDate: string | null;
    soundcloudUrl: string | null;
  };
  suggestedChanges: {
    title: string;
    artist: string;
    genre: string;
    releaseDate: string | null;
    soundcloudUrl: string | null;
  };
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

// Utility to safely format dates
function safeFormatDate(date: any, fallback = 'Not set') {
  if (!date) return fallback;
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'MMM d, yyyy');
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? fallback : format(d, 'MMM d, yyyy');
}

const EditSuggestionsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isAdmin } = useAdmin();
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<EditSuggestion | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchSuggestions = async () => {
      try {
        console.log('Fetching edit suggestions...');
        const suggestionsQuery = query(
          collection(db, 'editSuggestions'),
          where('status', '==', 'pending')
        );
        const snapshot = await getDocs(suggestionsQuery);
        console.log('Found suggestions:', snapshot.docs.length);
        
        const suggestionsData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing suggestion:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            originalSong: data.originalSong || {},
            suggestedChanges: data.suggestedChanges || {},
            submittedAt: data.submittedAt || new Date().toISOString(),
            reviewedBy: data.reviewedBy || null,
            reviewedAt: data.reviewedAt || null,
            reviewNotes: data.reviewNotes || null
          };
        }) as EditSuggestion[];

        console.log('Processed suggestions:', suggestionsData);
        setSuggestions(suggestionsData);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        toast.error('Failed to load edit suggestions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [isAdmin, navigate]);

  const handleReview = (suggestion: EditSuggestion) => {
    setSelectedSuggestion(suggestion);
    setReviewNotes('');
    setIsReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSuggestion || !currentUser) return;

    try {
      // Update the song with suggested changes
      const songRef = doc(db, 'songs', selectedSuggestion.songId);
      await updateDoc(songRef, {
        ...selectedSuggestion.suggestedChanges,
        lastEditedBy: selectedSuggestion.submittedBy,
        lastEditedAt: new Date()
      });

      // Update the suggestion status
      const suggestionRef = doc(db, 'editSuggestions', selectedSuggestion.id);
      await updateDoc(suggestionRef, {
        status: 'approved',
        reviewedBy: currentUser.uid,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNotes.trim() || null
      });

      // Update local state
      setSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
      setIsReviewDialogOpen(false);
      toast.success('Edit suggestion approved');
    } catch (error) {
      console.error('Error approving suggestion:', error);
      toast.error('Failed to approve edit suggestion');
    }
  };

  const handleReject = async () => {
    if (!selectedSuggestion || !currentUser) return;

    try {
      const suggestionRef = doc(db, 'editSuggestions', selectedSuggestion.id);
      await updateDoc(suggestionRef, {
        status: 'rejected',
        reviewedBy: currentUser.uid,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNotes.trim() || null
      });

      // Update local state
      setSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
      setIsReviewDialogOpen(false);
      toast.success('Edit suggestion rejected');
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast.error('Failed to reject edit suggestion');
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pending Song Edits</h1>

      {suggestions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No pending edits to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-music-surface rounded-lg p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold">
                      {suggestion.originalSong.title}
                    </h2>
                    <Badge>Pending Edit</Badge>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Submitted {safeFormatDate(suggestion.submittedAt, 'Unknown')}
                  </p>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Original</h3>
                      <dl className="space-y-1 text-sm">
                        <div>
                          <dt className="inline text-gray-400">Title: </dt>
                          <dd className="inline">{suggestion.originalSong.title}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Artist: </dt>
                          <dd className="inline">{suggestion.originalSong.artist}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Genre: </dt>
                          <dd className="inline">{suggestion.originalSong.genre}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Release Date: </dt>
                          <dd className="inline">
                            {safeFormatDate(suggestion.originalSong.releaseDate)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Suggested Changes</h3>
                      <dl className="space-y-1 text-sm">
                        <div>
                          <dt className="inline text-gray-400">Title: </dt>
                          <dd className="inline">{suggestion.suggestedChanges.title}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Artist: </dt>
                          <dd className="inline">{suggestion.suggestedChanges.artist}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Genre: </dt>
                          <dd className="inline">{suggestion.suggestedChanges.genre}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Release Date: </dt>
                          <dd className="inline">
                            {safeFormatDate(suggestion.suggestedChanges.releaseDate)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Reason for Changes</h3>
                    <p className="text-sm text-gray-300">{suggestion.reason}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReview(suggestion)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Edit</DialogTitle>
            <DialogDescription>
              Review the proposed changes and provide feedback if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Review Notes (Optional)
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about your decision..."
                className="bg-gray-800/50 border-gray-700"
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-red-500 border-red-500 hover:bg-red-500/10"
                onClick={handleReject}
              >
                Reject
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600"
                onClick={handleApprove}
              >
                Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditSuggestionsPage; 