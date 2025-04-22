export interface Song {
  id: string;
  title: string;
  artist: string;
  artists: string[];
  artistIds: string[];
  genre: string;
  releaseDate: string | null;
  audioUrl?: string;
  soundcloudUrl: string | null;
  soundcloudEmbed?: string;
  imageUrl?: string;
  isFavorite: boolean;
  uploadDate: string;
  createdAt?: string;
  favoritedBy: string[];
  favoritedAt: string[];
  favoriteCount: number;
  updatedAt: string;
  userId: string;
}
