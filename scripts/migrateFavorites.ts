import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../src/lib/firebase";

async function migrateFavorites() {
  const songsRef = collection(db, "songs");
  const snapshot = await getDocs(songsRef);

  for (const songDoc of snapshot.docs) {
    const data = songDoc.data();
    const favoritedBy = data.favoritedBy || [];
    const favoritedAt = data.favoritedAt || [];
    const favorites: { [userId: string]: string } = {};

    // Map userId to timestamp if available
    favoritedBy.forEach((userId: string, idx: number) => {
      favorites[userId] = favoritedAt[idx] || new Date().toISOString();
    });

    // Only update if there are old favorites to migrate
    if (Object.keys(favorites).length > 0) {
      await updateDoc(doc(db, "songs", songDoc.id), {
        favorites,
        // Optionally, remove old fields:
        // favoritedBy: deleteField(),
        // favoritedAt: deleteField(),
      });
      console.log(`Migrated favorites for song: ${songDoc.id}`);
    }
  }
}

migrateFavorites().then(() => {
  console.log("Migration complete!");
}); 