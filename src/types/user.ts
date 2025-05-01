import { Song } from './song';

export interface UserProfile {
  username: string;
  email: string;
  isPublic: boolean;
  uploadCount: number;
  createdAt: string;
  isArtist: boolean;
  isVerified: boolean;
  role: UserRole;
  points: number;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    soundcloud?: string;
    website?: string;
  };
  followers: string[];
  following: string[];
}

export type UserRole = 'new_user' | 'verified_contributor' | 'admin' | 'super_admin';

export type VerificationStatus = 'pending' | 'community_verified' | 'artist_verified' | 'hidden';

export type UserTier = 'novice' | 'trusted' | 'expert';

export interface UserVerification {
  role: UserRole;
  tier: UserTier;
  points: number;
  verifiedUploads: number;
  deletedUploads: number;
  isArtistVerified: boolean;
  isLabelVerified: boolean;
  verificationDate?: Date;
}

export interface UserStats {
  points: number;
  totalUploads: number;
  verifiedUploads: number;
  deletedUploads: number;
  joinedAt: Date;
  lastActive: Date;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  stats: UserStats;
  following?: string[];
  followers?: string[];
}

export interface VerificationAction {
  id: string;
  userId: string;
  songId: string;
  actionType: 'confirm' | 'report' | 'edit' | 'bulk_import';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  notes?: string;
  proposedChanges?: Partial<Song>;
}

export interface VerificationMetrics {
  accuracyRate: number;
  averageConfirmationTime: number;
  artistAdoptionRate: number;
  moderatorResponseTime: number;
}

export const POINTS_THRESHOLDS = {
  VERIFIED_CONTRIBUTOR: 10, // Need 10 points to become verified contributor
};

export const POINTS_REWARDS = {
  VERIFIED_UPLOAD: 1,    // +1 point when community verifies your upload
  DELETED_UPLOAD: -1,    // -1 point when moderators delete your upload
  CONFIRM_SONG: 1,       // +1 point for confirming a song
  UPLOAD_SONG: 1,        // +1 point when uploading a song
  UPLOAD_CONFIRMED: 5,   // +5 points when your uploaded song gets confirmed
};

export function calculateUserRole(stats: UserStats): UserRole {
  if (stats.points >= POINTS_THRESHOLDS.VERIFIED_CONTRIBUTOR) {
    return 'verified_contributor';
  }
  return 'new_user';
}

export interface Report {
  id: string;
  songId: string;
  userId: string;
  reason: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  processedAt: Date | null;
  processedBy: string | null;
} 