import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/user';
import { searchArtists } from '@/lib/firebase';
import { Verified, Music2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ArtistsPageProps {
  searchTerm: string;
}

const ArtistCard: React.FC<{ artist: UserProfile & { id: string } }> = ({ artist }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/artist/${artist.id}`)}
      className="group bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 cursor-pointer hover:bg-gray-800/50 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white group-hover:text-music-accent transition-colors">
              {artist.username}
            </h3>
            {artist.isVerified && (
              <Verified className="h-4 w-4 text-blue-500" />
            )}
          </div>
          
          {artist.bio && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-4">
              {artist.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Music2 className="h-3 w-3" />
              <span>{artist.uploadCount || 0}</span>
            </Badge>
            <Badge variant="secondary">
              {artist.followers?.length || 0} Followers
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArtistsPage: React.FC<ArtistsPageProps> = ({ searchTerm }) => {
  const [artists, setArtists] = useState<(UserProfile & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      setIsLoading(true);
      try {
        const results = await searchArtists(searchTerm);
        setArtists(results);
      } catch (error) {
        console.error('Error loading artists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtists();
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {searchTerm ? 'Search Results' : 'Featured Artists'}
        </h1>
      </div>

      {artists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          {searchTerm
            ? 'No artists found matching your search.'
            : 'No artists available.'}
        </div>
      )}
    </div>
  );
};

export default ArtistsPage; 