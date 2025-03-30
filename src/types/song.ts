
export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  releaseDate: string | null;
  audioUrl?: string;
  soundcloudUrl?: string;
  imageUrl?: string;
  isFavorite: boolean;
  uploadDate: string;
  createdAt?: string;
  favoritedAt?: string[];
  favoritedBy?: string[];
}
