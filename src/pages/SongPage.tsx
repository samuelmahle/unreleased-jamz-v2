import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Song } from '../types/song';
import { Heart, Share2, ArrowLeft, Flag, ThumbsUp, ThumbsDown, AlertTriangle, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVerification } from '../contexts/VerificationContext';
import { getFormattedDate } from '../lib/utils';
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
import { Input } from "../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useAdmin } from '../contexts/AdminContext';

const REPORT_REASONS = [
  { id: 'wrong_artist', label: 'Wrong Artist', description: 'The artist attribution is incorrect' },
  { id: 'fake_leak', label: 'Fake Leak', description: 'This is not a genuine unreleased track' },
  { id: 'duplicate', label: 'Duplicate Upload', description: 'This song has already been uploaded' },
  { id: 'wrong_title', label: 'Wrong Title', description: 'The song title is incorrect' },
  { id: 'copyright', label: 'Copyright Violation', description: 'This upload violates copyright laws' },
  { id: 'other', label: 'Other', description: 'Other issue not listed above' },
];

const DOWNVOTE_REASONS = [
  { id: 'wrong_artist', label: 'Wrong Artist', description: 'The artist attribution is incorrect' },
  { id: 'fake_leak', label: 'Fake Leak', description: 'This is not a genuine unreleased track' },
  { id: 'duplicate', label: 'Duplicate Upload', description: 'This song has already been uploaded' },
  { id: 'wrong_title', label: 'Wrong Title', description: 'The song title is incorrect' },
  { id: 'low_quality', label: 'Low Quality', description: 'The audio quality is too poor' },
  { id: 'other', label: 'Other', description: 'Other issue not listed above' },
];

const SongPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const { currentUser, userFavorites } = useAuth();
  const { verifySong, reportSong, upvoteVerification, downvoteVerification } = useVerification();
  const { isAdmin, isSuperAdmin } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDownvoteDialogOpen, setIsDownvoteDialogOpen] = useState(false);
  const [selectedDownvoteReason, setSelectedDownvoteReason] = useState('');
  const [downvoteDetails, setDownvoteDetails] = useState('');

  const canEditSong = (song: Song) => {
    if (!currentUser) return false;
    if (isAdmin || isSuperAdmin) return true;
    return song.userId === currentUser.uid;
  };

  const canReportSong = (song: Song) => {
    if (!currentUser) return false;
    if (song.userId === currentUser.uid) return false;
    return true;
  };

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;
      
      try {
        const songDoc = await getDoc(doc(db, 'songs', id));
        if (songDoc.exists()) {
          setSong({
            ...songDoc.data() as Song,
            id: songDoc.id,
            isFavorite: userFavorites.includes(songDoc.id)
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
  }, [id, navigate, userFavorites]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleUpvote = async () => {
    if (!song || !currentUser) return;
    await upvoteVerification(song.id);
    const updatedDoc = await getDoc(doc(db, 'songs', song.id));
    setSong({ id: updatedDoc.id, ...updatedDoc.data() } as Song);
  };

  const handleDownvote = async () => {
    if (!song || !currentUser || !selectedDownvoteReason) {
      toast.error('Please select a reason for downvoting');
      return;
    }
    await downvoteVerification(song.id);
    const updatedDoc = await getDoc(doc(db, 'songs', song.id));
    setSong({ id: updatedDoc.id, ...updatedDoc.data() } as Song);
    setIsDownvoteDialogOpen(false);
    setSelectedDownvoteReason('');
    setDownvoteDetails('');
    toast.success('Song downvoted');
  };

  const handleReport = async () => {
    if (!song || !selectedReportReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    try {
      await reportSong(song.id, selectedReportReason, reportDetails.trim());
      setIsReportDialogOpen(false);
      setSelectedReportReason('');
      setReportDetails('');
      toast.success('Song reported successfully');
    } catch (error: any) {
      console.error('Error reporting song:', error);
      toast.error(error.message || 'Failed to report song');
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 hover:bg-gray-800"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="bg-music-surface rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{song.title}</h1>
                {song.verificationStatus === 'pending' && (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                    {((Object.keys(song.upvotes || {}).length || 0) - (Object.keys(song.downvotes || {}).length || 0))}/3
                  </Badge>
                )}
              </div>
              <p className="text-lg text-gray-300">{song.artist}</p>
            </div>
            <div className="flex items-center gap-2">
              {song && canEditSong(song) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-500 border-blue-500 hover:bg-blue-500/10"
                  onClick={() => navigate(`/songs/${song.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {currentUser && !canEditSong(song) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-500 border-purple-500 hover:bg-purple-500/10"
                  onClick={() => navigate(`/songs/${song.id}/suggest-edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {song.verificationStatus === 'pending' && currentUser && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${
                      Object.keys(song.upvotes || {}).length > 0
                        ? 'bg-green-500/10 text-green-500 border-green-500'
                        : 'text-gray-400 border-gray-400 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500'
                    }`}
                    onClick={handleUpvote}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {Object.keys(song.upvotes || {}).length}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${
                      Object.keys(song.downvotes || {}).length > 0
                        ? 'bg-red-500/10 text-red-500 border-red-500'
                        : 'text-gray-400 border-gray-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500'
                    }`}
                    onClick={() => setIsDownvoteDialogOpen(true)}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </>
              )}
              {canReportSong(song) && song.verificationStatus !== 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500 hover:bg-red-500/10"
                  onClick={() => setIsReportDialogOpen(true)}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="aspect-video mb-6">
          {song.soundcloudUrl ? (
            <iframe
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
              className="rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
              <p className="text-gray-400">Link not available</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          {song.verificationStatus !== 'pending' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Heart
                className={`h-5 w-5 ${
                  song.isFavorite ? "fill-music-accent text-music-accent" : "text-gray-400"
                }`}
              />
              <span className="text-sm text-gray-400">
                {Object.keys(song.favorites || {}).length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-800"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          )}
          
          <span className="text-sm text-gray-400 ml-auto">
            {getFormattedDate(song.releaseDate)}
          </span>
        </div>
      </div>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Report Song
            </DialogTitle>
            <DialogDescription>
              Please select a reason for reporting this song. This will help moderators review the issue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <RadioGroup
              value={selectedReportReason}
              onValueChange={setSelectedReportReason}
              className="space-y-3"
            >
              {REPORT_REASONS.map((reason) => (
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
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional context that might help with the review..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReport}
              disabled={!selectedReportReason}
              className="bg-red-500 hover:bg-red-600"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default SongPage; 