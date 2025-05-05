import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

interface VerificationContextType {
  verifySong: (songId: string) => Promise<void>;
  reportSong: (songId: string, reason: string, details: string) => Promise<void>;
  upvoteVerification: (songId: string) => Promise<void>;
  downvoteVerification: (songId: string) => Promise<void>;
  proposeEdit: (songId: string, updates: any, notes: string, originalSong: any) => Promise<void>;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};

export const VerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const verifySong = async (songId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to verify songs');
      return;
    }

    try {
      const songRef = doc(db, 'songs', songId);
      const userRef = doc(db, 'users', currentUser.uid);

      await updateDoc(songRef, {
        verificationStatus: 'verified',
        verifiedBy: arrayUnion(currentUser.uid),
        verifiedAt: new Date().toISOString()
      });

      // Add points for verification
      await updateDoc(userRef, {
        points: increment(200)
      });

      toast.success('Song verified successfully');
    } catch (error) {
      console.error('Error verifying song:', error);
      toast.error('Failed to verify song');
    }
  };

  const reportSong = async (songId: string, reason: string, details: string = '') => {
    if (!currentUser) {
      toast.error('You must be logged in to report songs');
      return;
    }

    try {
      const songRef = doc(db, 'songs', songId);
      const songDoc = await getDoc(songRef);
      const songData = songDoc.data();

      if (!songData) {
        throw new Error('Song not found');
      }

      // Create a new report document
      const reportData = {
        songId,
        songTitle: songData.title,
        userId: currentUser.uid,
        reason,
        details,
        status: 'pending',
        createdAt: new Date(),
        processedAt: null,
        processedBy: null
      };

      console.log('Creating report with data:', reportData);
      const reportRef = await addDoc(collection(db, 'reports'), reportData);
      console.log('Report created with ID:', reportRef.id);

      // Update the song's report count
      await updateDoc(songRef, {
        reports: increment(1),
        reportedBy: arrayUnion(currentUser.uid),
        reportedAt: arrayUnion(new Date().toISOString())
      });

      toast.success('Song reported successfully');
    } catch (error) {
      console.error('Error reporting song:', error);
      toast.error('Failed to report song');
      throw error;
    }
  };

  const upvoteVerification = async (songId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to upvote');
      return;
    }

    try {
      const songRef = doc(db, 'songs', songId);
      const songDoc = await getDoc(songRef);
      const songData = songDoc.data();

      if (!songData) {
        throw new Error('Song not found');
      }

      // Get current upvotes and downvotes
      const currentUpvotes = songData.upvotes || [];
      const currentDownvotes = songData.downvotes || [];

      // Check if user has already upvoted
      if (currentUpvotes.includes(currentUser.uid)) {
        toast.error('You have already upvoted this song');
        return;
      }

      // Add user to upvotes and remove from downvotes
      const newUpvotes = [...currentUpvotes, currentUser.uid];
      const newDownvotes = currentDownvotes.filter(id => id !== currentUser.uid);

      // Calculate net votes
      const netVotes = newUpvotes.length - newDownvotes.length;

      // Update song document
      const updateData: any = {
        upvotes: newUpvotes,
        downvotes: newDownvotes
      };

      // If net votes reaches 3, update verification status
      if (netVotes >= 3 && songData.verificationStatus === 'pending') {
        updateData.verificationStatus = 'verified';
        updateData.verifiedAt = new Date().toISOString();
      }

      await updateDoc(songRef, updateData);

      if (netVotes >= 3 && songData.verificationStatus === 'pending') {
        toast.success('Song has been verified!');
      } else {
        toast.success('Upvoted successfully');
      }
    } catch (error) {
      console.error('Error upvoting:', error);
      toast.error('Failed to upvote');
    }
  };

  const downvoteVerification = async (songId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to downvote');
      return;
    }

    try {
      const songRef = doc(db, 'songs', songId);
      await updateDoc(songRef, {
        downvotes: arrayUnion(currentUser.uid),
        upvotes: arrayRemove(currentUser.uid)
      });

      toast.success('Downvoted successfully');
    } catch (error) {
      console.error('Error downvoting:', error);
      toast.error('Failed to downvote');
    }
  };

  const proposeEdit = async (songId: string, updates: any, notes: string, originalSong: any) => {
    if (!currentUser) {
      toast.error('You must be logged in to propose an edit');
      return;
    }
    try {
      await addDoc(collection(db, 'editSuggestions'), {
        songId,
        originalSong,
        suggestedChanges: updates,
        reason: notes,
        status: 'pending',
        submittedBy: currentUser.uid,
        submittedAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null
      });
      toast.success('Edit suggestion submitted successfully');
    } catch (error) {
      console.error('Error submitting edit suggestion:', error);
      toast.error('Failed to submit edit suggestion');
    }
  };

  const value = {
    verifySong,
    reportSong,
    upvoteVerification,
    downvoteVerification,
    proposeEdit
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
};

export default VerificationContext; 