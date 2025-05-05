import { VerificationStatus } from './user';
import { Timestamp } from 'firebase/firestore';

export interface Song {
  id: string;
  title: string;
  artist: string;
  artists?: string[];
  artistIds?: string[];
  genre: string;
  releaseDate: string | null;
  soundcloudUrl: string | null;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  favoritedBy?: string[];
  favoritedAt?: string[];
  favoritedByTimestamp?: Timestamp[];
  recentLikes?: number;
  isFavorite?: boolean;
  isUnreleased?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string[];
  reportedBy?: string[];
  upvotedBy?: string[];
  downvotedBy?: string[];
  upvotes?: number;
  downvotes?: number;
  favorites?: { [userId: string]: string };
}
