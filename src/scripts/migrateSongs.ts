import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function migrateSongs() {
  try {
    console.log('Starting song migration...');
    const songsRef = collection(db, 'songs');
    const snapshot = await getDocs(songsRef);
    
    let migratedCount = 0;
    const now = new Date().toISOString();

    for (const songDoc of snapshot.docs) {
      const songData = songDoc.data();
      const updates: Record<string, any> = {};
      
      // Check and add missing fields
      if (!songData.uploadDate) {
        updates.uploadDate = songData.createdAt?.toDate().toISOString() || now;
      }
      
      if (!songData.updatedAt) {
        updates.updatedAt = now;
      }
      
      // Only update if there are missing fields
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'songs', songDoc.id), updates);
        migratedCount++;
        console.log(`Migrated song: ${songData.title} (${songDoc.id})`);
      }
    }
    
    console.log(`Migration complete. Updated ${migratedCount} songs.`);
    return { success: true, migratedCount };
  } catch (error) {
    console.error('Error during migration:', error);
    return { success: false, error };
  }
} 