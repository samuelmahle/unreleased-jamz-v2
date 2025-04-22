export interface UserProfile {
  username: string;
  email: string;
  isPublic: boolean;
  uploadCount: number;
  createdAt: string;
  isArtist: boolean;
  isVerified: boolean;
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