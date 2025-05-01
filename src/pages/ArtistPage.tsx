import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types/user';
import { Song } from '@/types/song';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SongCard from '@/components/song-card';
import { Badge } from '@/components/ui/badge';
import { Verified, Instagram, Twitter, Globe, Music2 } from 'lucide-react';

interface ArtistPageProps {
  onFavorite: (songId: string) => void;
}

const ArtistPage: React.FC<ArtistPageProps> = ({ onFavorite }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [artist, setArtist] = useState<UserProfile | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadArtistAndSongs = async () => {
      if (!id) return;

      try {
        // Load artist profile
        const artistDoc = await getDoc(doc(db, 'users', id));
        if (!artistDoc.exists()) {
          toast.error('Artist not found');
          navigate('/');
          return;
        }

        const artistData = artistDoc.data() as UserProfile;
        setArtist(artistData);
        setIsFollowing(currentUser ? artistData.followers.includes(currentUser.uid) : false);

        // Load all songs where this artist appears (either as primary or secondary)
        const songsQuery = query(
          collection(db, 'songs'),
          where('artistIds', 'array-contains', id)
        );
        const songsSnapshot = await getDocs(songsQuery);
        const artistSongs = songsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isFavorite: currentUser ? doc.data().favoritedBy?.includes(currentUser.uid) : false
        })) as Song[];

        setSongs(artistSongs);
      } catch (error) {
        console.error('Error loading artist:', error);
        toast.error('Failed to load artist profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadArtistAndSongs();
  }, [id, navigate, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !artist || !id) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const artistRef = doc(db, 'users', id);

      if (isFollowing) {
        await Promise.all([
          updateDoc(userRef, {
            following: arrayRemove(id)
          }),
          updateDoc(artistRef, {
            followers: arrayRemove(currentUser.uid)
          })
        ]);
        setIsFollowing(false);
        toast.success('Unfollowed artist');
      } else {
        await Promise.all([
          updateDoc(userRef, {
            following: arrayUnion(id)
          }),
          updateDoc(artistRef, {
            followers: arrayUnion(currentUser.uid)
          })
        ]);
        setIsFollowing(true);
        toast.success('Following artist');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music"></div>
      </div>
    );
  }

  if (!artist) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold">{artist.username}</h1>
              {artist.isVerified && (
                <Verified className="h-6 w-6 text-blue-500" />
              )}
            </div>
            
            {artist.bio && (
              <p className="text-gray-300 mb-4 max-w-2xl">{artist.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{songs.length} Tracks</Badge>
                <Badge variant="secondary">{artist.followers.length} Followers</Badge>
              </div>
            </div>

            {artist.socialLinks && (
              <div className="flex gap-4">
                {artist.socialLinks.instagram && (
                  <a
                    href={`https://instagram.com/${artist.socialLinks.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {artist.socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${artist.socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {artist.socialLinks.website && (
                  <a
                    href={artist.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {currentUser && currentUser.uid !== id && (
            <Button
              onClick={handleFollow}
              variant={isFollowing ? "outline" : "default"}
              className={isFollowing ? "hover:bg-gray-800" : "bg-music hover:bg-music-accent"}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Music2 className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Tracks</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onFavorite={onFavorite}
              isActive={false}
            />
          ))}
        </div>

        {songs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No tracks uploaded yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistPage; 