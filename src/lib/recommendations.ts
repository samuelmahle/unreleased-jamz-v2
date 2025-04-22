import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Song } from '@/types/song';
import { UserProfile } from '@/types/user';

interface RecommendationParams {
  userId: string;
  userProfile: UserProfile;
  limit?: number;
}

export async function getRecommendedSongs({ userId, userProfile, limit: resultLimit = 10 }: RecommendationParams): Promise<Song[]> {
  console.log('=== Starting Recommendation Process ===');
  console.log('User ID:', userId);
  console.log('Profile:', {
    following: userProfile.following?.length || 0,
    followers: userProfile.followers?.length || 0
  });
  
  const recommendations = new Set<Song>();
  let userLikedSongIds = new Set<string>();
  
  try {
    // First, get the user's liked songs to mark recommendations properly
    const userLikedSongsQuery = query(
      collection(db, 'songs'),
      where('favoritedBy', 'array-contains', userId)
    );
    const userLikedSongs = await getDocs(userLikedSongsQuery);
    userLikedSongIds = new Set(userLikedSongs.docs.map(doc => doc.id));
    
    // 1. Get songs from followed artists (prioritize this)
    if (userProfile.following?.length > 0) {
      console.log('\n1. Finding songs from followed artists');
      console.log('Following artists:', userProfile.following);
      
      const artistSongsQuery = query(
        collection(db, 'songs'),
        where('userId', 'in', userProfile.following),
        orderBy('createdAt', 'desc'),
        limit(10) // Increased limit for followed artists
      );
      
      try {
        const artistSongs = await getDocs(artistSongsQuery);
        console.log('Found artist songs:', artistSongs.size);
        if (artistSongs.size > 0) {
          artistSongs.forEach(doc => {
            const songData = doc.data();
            const song = {
              id: doc.id,
              ...songData,
              isFavorite: userLikedSongIds.has(doc.id)
            } as Song;
            console.log('- Adding artist song:', { title: song.title, artist: song.artist, userId: song.userId });
            recommendations.add(song);
          });
        }
      } catch (error) {
        console.error('Error fetching artist songs:', error);
      }
    }

    // 2. Get trending songs in genres you engage with
    const genreQuery = query(
      collection(db, 'songs'),
      where('genre', '==', 'Electronic'), // Since your site focuses on Electronic music
      orderBy('favoriteCount', 'desc'),
      limit(5)
    );
    
    try {
      const trendingSongs = await getDocs(genreQuery);
      console.log('Found trending songs:', trendingSongs.size);
      if (trendingSongs.size > 0) {
        trendingSongs.forEach(doc => {
          const songData = doc.data();
          // Don't add if it's already in recommendations
          if (!Array.from(recommendations).some(s => s.id === doc.id)) {
            const song = {
              id: doc.id,
              ...songData,
              isFavorite: userLikedSongIds.has(doc.id)
            } as Song;
            console.log('- Adding trending song:', { title: song.title, artist: song.artist });
            recommendations.add(song);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching trending songs:', error);
    }

    // 3. Get recent releases from active artists
    const recentReleasesQuery = query(
      collection(db, 'songs'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    try {
      const recentSongs = await getDocs(recentReleasesQuery);
      console.log('Found recent songs:', recentSongs.size);
      if (recentSongs.size > 0) {
        recentSongs.forEach(doc => {
          const songData = doc.data();
          // Don't add if it's already in recommendations
          if (!Array.from(recommendations).some(s => s.id === doc.id)) {
            const song = {
              id: doc.id,
              ...songData,
              isFavorite: userLikedSongIds.has(doc.id)
            } as Song;
            console.log('- Adding recent song:', { title: song.title, artist: song.artist });
            recommendations.add(song);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching recent songs:', error);
    }

    const finalRecommendations = Array.from(recommendations).slice(0, resultLimit);
    console.log('\n=== Final Recommendations ===');
    console.log('Total recommendations:', finalRecommendations.length);
    if (finalRecommendations.length > 0) {
      finalRecommendations.forEach(song => {
        console.log('-', song.title, 'by', song.artist, '(Genre:', song.genre, ') Favorited:', song.isFavorite);
      });
    } else {
      console.log('No recommendations generated');
    }
    
    return finalRecommendations;
  } catch (error) {
    console.error('Error in recommendation process:', error);
    return [];
  }
} 