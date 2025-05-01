import { collection, getDocs, query, where, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function createArtistProfile(artistName: string) {
  try {
    // Clean up artist name
    const cleanArtistName = artistName.trim();
    
    // Check if artist already exists
    const artistsQuery = query(
      collection(db, 'users'),
      where('username', '==', cleanArtistName),
      where('isArtist', '==', true)
    );
    const existingArtists = await getDocs(artistsQuery);
    
    if (!existingArtists.empty) {
      // Return existing artist's ID
      return existingArtists.docs[0].id;
    }

    // Create new artist profile
    const artistId = doc(collection(db, 'users')).id;
    await setDoc(doc(db, 'users', artistId), {
      username: cleanArtistName,
      email: `${cleanArtistName.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`,
      isPublic: true,
      uploadCount: 0,
      createdAt: new Date().toISOString(),
      isArtist: true,
      isVerified: false,
      bio: `Music by ${cleanArtistName}`,
      followers: [],
      following: []
    });

    return artistId;
  } catch (error) {
    console.error('Error creating artist profile:', error);
    throw error;
  }
}

function splitArtists(artistString: string): string[] {
  // Split by comma and clean up each name
  return artistString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

export async function migrateArtists() {
  try {
    // Get all songs
    const songsSnapshot = await getDocs(collection(db, 'songs'));
    const songs = songsSnapshot.docs;
    
    console.log(`Found ${songs.length} songs to process`);

    for (const songDoc of songs) {
      const songData = songDoc.data();
      const songId = songDoc.id;

      try {
        // Get all artists for this song
        let artists: string[] = [];
        
        if (songData.artists) {
          // If artists array exists, process each artist for potential comma separation
          artists = songData.artists.flatMap(splitArtists);
        } else if (songData.artist) {
          // If only single artist exists, split it
          artists = splitArtists(songData.artist);
        }

        if (artists.length === 0) {
          console.log(`Skipping song ${songId} - no artists found`);
          continue;
        }

        console.log(`Processing song ${songId} with artists:`, artists);

        // Create or get artist profiles for each artist
        const artistIds = await Promise.all(artists.map(createArtistProfile));

        // Update the song with artist IDs
        await updateDoc(doc(db, 'songs', songId), {
          artist: artists[0], // Primary artist
          artists: artists, // All artists
          artistIds: artistIds, // All artist IDs
          userId: artistIds[0] // Primary artist's ID
        });

        // Increment upload count for all artists
        await Promise.all(artistIds.map(async (artistId) => {
          const artistRef = doc(db, 'users', artistId);
          await updateDoc(artistRef, {
            uploadCount: (songData.uploadCount || 0) + 1
          });
        }));

        console.log(`Successfully processed song ${songId}`);
      } catch (error) {
        console.error(`Error processing song ${songId}:`, error);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateArtists().then(() => {
  console.log('Migration script completed');
}).catch((error) => {
  console.error('Migration script failed:', error);
}); 