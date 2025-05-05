import { collection, getDocs, updateDoc, doc, deleteField } from "firebase/firestore";
import { db } from "../src/lib/firebase";

async function cleanupOldFavorites() {
  const songsRef = collection(db, "songs");
  const snapshot = await getDocs(songsRef);

  for (const songDoc of snapshot.docs) {
    await updateDoc(doc(db, "songs", songDoc.id), {
      favoritedBy: deleteField(),
      favoritedAt: deleteField(),
    });
    console.log(`Cleaned up old favorites fields for song: ${songDoc.id}`);
  }
}

cleanupOldFavorites().then(() => {
  console.log("Cleanup complete!");
}); 