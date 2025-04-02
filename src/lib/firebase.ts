import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDaiK1W1AgWtzlpiGtG3BOLU8mwmLYY4wc",
  authDomain: "musicita-b0f83.firebaseapp.com",
  projectId: "musicita-b0f83",
  storageBucket: "musicita-b0f83.firebasestorage.app",
  messagingSenderId: "304102525848",
  appId: "1:304102525848:web:7c0cc434a34dbbd2ff79ed",
  measurementId: "G-GQYL2Y9MTQ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

interface UserData {
  username: string;
  email: string;
  isPublic: boolean;
  uploadCount: number;
  createdAt: string;
}

// Auth functions
export const registerUser = async (email: string, password: string, userData: Omit<UserData, 'email'>) => {
  // Create the user account
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create the user document in Firestore
  const userRef = doc(db, 'users', userCredential.user.uid);
  await setDoc(userRef, {
    ...userData,
    email,
    favorites: [],
    followers: [],
    following: [],
  });

  return userCredential;
};

export const loginUser = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return signOut(auth);
};

// User favorites functions
export const toggleFavorite = async (userId: string, songId: string, isFavoriting: boolean) => {
  try {
    const songRef = doc(db, 'songs', songId);
    const userRef = doc(db, 'users', userId);
    const songDoc = await getDoc(songRef);
    const userDoc = await getDoc(userRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const currentFavoritedBy = songDoc.data().favoritedBy || [];
    const currentFavoritedAt = songDoc.data().favoritedAt || [];
    const timestamp = new Date().toISOString();

    // Update song document
    if (isFavoriting) {
      await updateDoc(songRef, {
        favoritedBy: arrayUnion(userId),
        favoritedAt: [...currentFavoritedAt, timestamp]
      });
    } else {
      // Find the index of the user's favorite to remove the corresponding timestamp
      const userFavoriteIndex = currentFavoritedBy.indexOf(userId);
      const updatedFavoritedAt = currentFavoritedAt.filter((_, index) => index !== userFavoriteIndex);
      
      await updateDoc(songRef, {
        favoritedBy: arrayRemove(userId),
        favoritedAt: updatedFavoritedAt
      });
    }

    // Update user's favorites array
    if (userDoc.exists()) {
      if (isFavoriting) {
        await updateDoc(userRef, {
          favorites: arrayUnion(songId)
        });
      } else {
        await updateDoc(userRef, {
          favorites: arrayRemove(songId)
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

export const getFavorites = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return userDoc.data().favorites || [];
  }
  
  return [];
};
