export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  releaseDate: string | null;
  audioUrl?: string;
  soundcloudUrl?: string;
  soundcloudEmbed?: string;
  imageUrl?: string;
  isFavorite: boolean;
  uploadDate: string;
  createdAt?: string;
  favoritedBy?: string[];
  favoritedAt?: string[];
  updatedAt: string;
}
