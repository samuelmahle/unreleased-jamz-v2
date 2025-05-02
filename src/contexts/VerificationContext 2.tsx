import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { Song } from '@/types/song';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface VerificationContextType {
  canConfirmSong: (song: Song) => boolean;
  canReportSong: (song: Song) => boolean;
  canEditSong: (song: Song) => boolean;
  confirmSong: (songId: string) => Promise<void>;
  reportSong: (songId: string, reportData: any) => Promise<void>;
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
  const { currentUser, addPoints } = useAuth();
  const { isSuperAdmin } = useAdmin();

  const canConfirmSong = (song: Song) => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    if (song.uploadedBy === currentUser.uid) return false;
    return !song.confirmedBy?.includes(currentUser.uid);
  };

  const canReportSong = (song: Song) => {
    if (!currentUser) return false;
    if (song.uploadedBy === currentUser.uid) return false;
    return !song.reportedBy?.includes(currentUser.uid);
  };

  const canEditSong = (song: Song) => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    if (song.uploadedBy === currentUser.uid) return true;
    return false;
  };

  const confirmSong = async (songId: string) => {
    if (!currentUser) throw new Error('Must be logged in to confirm songs');

    const songRef = doc(db, 'songs', songId);
    await updateDoc(songRef, {
      confirmedBy: [...(song.confirmedBy || []), currentUser.uid],
      verificationStatus: 'verified'
    });

    // Award points to the confirmer
    await addPoints(10);
  };

  const reportSong = async (songId: string, reportData: any) => {
    if (!currentUser) throw new Error('Must be logged in to report songs');

    const songRef = doc(db, 'songs', songId);
    const reportRef = collection(db, 'reports');

    await Promise.all([
      updateDoc(songRef, {
        reportedBy: [...(song.reportedBy || []), currentUser.uid],
        reportCount: (song.reportCount || 0) + 1
      }),
      addDoc(reportRef, {
        ...reportData,
        songId,
        reportedBy: currentUser.uid,
        timestamp: new Date()
      })
    ]);

    // Award points for reporting
    await addPoints(50);
  };

  const value = {
    canConfirmSong,
    canReportSong,
    canEditSong,
    confirmSong,
    reportSong
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
}; 