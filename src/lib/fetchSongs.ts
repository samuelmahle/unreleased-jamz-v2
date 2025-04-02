import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Song } from "@/types/song";

export const fetchSongs = async (): Promise<Song[]> => {
  const snapshot = await getDocs(collection(db, "songs"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Song[];
};
