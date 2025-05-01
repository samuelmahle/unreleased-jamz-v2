import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface VerificationContextType {
  verifySong: (songId: string) => Promise<void>;
  reportSong: (songId: string, reason: string, details: string) => Promise<void>;
  upvoteVerification: (songId: string) => Promise<void>;
  downvoteVerification: (songId: string) => Promise<void>;
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
      await addDoc(collection(db, 'reports'), {
        songId,
        songTitle: songData.title,
        userId: currentUser.uid,
        reason,
        details,
        status: 'pending',
        createdAt: new Date(),
        processedAt: null,
        processedBy: null
      });

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
      await updateDoc(songRef, {
        upvotes: arrayUnion(currentUser.uid),
        downvotes: arrayRemove(currentUser.uid)
      });

      toast.success('Upvoted successfully');
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

  const value = {
    verifySong,
    reportSong,
    upvoteVerification,
    downvoteVerification
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
};

export default VerificationContext; 