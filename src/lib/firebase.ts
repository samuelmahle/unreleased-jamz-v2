
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_ACTUAL_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-actual-project-id.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-actual-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-actual-project-id.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "your-actual-messaging-sender-id",
  appId: process.env.FIREBASE_APP_ID || "your-actual-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export const registerUser = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return signOut(auth);
};

// User favorites functions
export const toggleFavorite = async (userId: string, songId: string, isFavoriting: boolean) => {
  const userRef = doc(db, 'users', userId);
  
  // Check if user document exists, if not create it
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    await setDoc(userRef, { favorites: [] });
  }
  
  // Update favorites array
  if (isFavoriting) {
    return updateDoc(userRef, {
      favorites: arrayUnion(songId)
    });
  } else {
    return updateDoc(userRef, {
      favorites: arrayRemove(songId)
    });
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
