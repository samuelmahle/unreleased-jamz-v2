import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, collection, getDocs, deleteDoc, deleteField } from 'firebase/firestore';
import { UserProfile } from '@/types/user';

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
export const toggleFavorite = async (userId: string, songId: string) => {
  const userRef = doc(db, 'users', userId);
  const songRef = doc(db, 'songs', songId);

  const songDoc = await getDoc(songRef);
  const songData = songDoc.data();
  const favorites = songData?.favorites || {};
  const isFavorited = Object.keys(favorites).includes(userId);

  if (isFavorited) {
    // Remove from favorites
    await Promise.all([
      updateDoc(userRef, {
        favorites: arrayRemove(songId)
      }),
      updateDoc(songRef, {
        [`favorites.${userId}`]: deleteField(),
        favoriteCount: increment(-1)
      })
    ]);
  } else {
    // Add to favorites
    await Promise.all([
      updateDoc(userRef, {
        favorites: arrayUnion(songId)
      }),
      updateDoc(songRef, {
        [`favorites.${userId}`]: new Date().toISOString(),
        favoriteCount: increment(1)
      })
    ]);
  }

  return !isFavorited;
};

export const getFavorites = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return userDoc.data().favorites || [];
  }
  
  return [];
};

export const updateExistingSongsWithGenre = async () => {
  try {
    const songsRef = collection(db, 'songs');
    const songsSnapshot = await getDocs(songsRef);
    
    const updatePromises = songsSnapshot.docs.map(async (songDoc) => {
      const songData = songDoc.data();
      return updateDoc(doc(db, 'songs', songDoc.id), {
        genre: songData.genre || 'Electronic'  // Keep existing genre or set to Electronic
      });
    });
    
    await Promise.all(updatePromises.filter(Boolean));
    return true;
  } catch (error) {
    console.error('Error updating songs with genre:', error);
    throw error;
  }
};

export const searchArtists = async (searchTerm: string): Promise<(UserProfile & { id: string })[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...(doc.data() as UserProfile)
      }))
      .filter(user => 
        user.isPublic && (
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
  } catch (error) {
    console.error('Error searching artists:', error);
    throw error;
  }
};

export const ensureSuperAdmin = async (uid: string, email: string) => {
  try {
    const adminRef = doc(db, 'admins', uid);
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists() && email === 'sam18mahle@gmail.com') {
      const superAdminData = {
        uid,
        email,
        role: 'super_admin' as const,
        permissions: {
          canManageAdmins: true,
          canVerifyArtists: true,
          canManageReports: true,
          canBulkImport: true,
          canEditAllSongs: true,
        },
        addedBy: uid,
        addedAt: new Date(),
        lastActive: new Date(),
      };

      await setDoc(adminRef, superAdminData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error ensuring super admin:', error);
    throw error;
  }
};

// Song deletion function
export const deleteSong = async (songId: string) => {
  const songRef = doc(db, 'songs', songId);
  await deleteDoc(songRef);
};

// Auto-verify existing songs
export const autoVerifyExistingSongs = async () => {
  try {
    const songsRef = collection(db, 'songs');
    const songsSnapshot = await getDocs(songsRef);
    
    const updatePromises = songsSnapshot.docs.map(async (songDoc) => {
      const songData = songDoc.data();
      const upvotes = songData.upvotes || [];
      
      // If song doesn't have 3 upvotes yet, add system upvotes
      if (upvotes.length < 3) {
        const systemUpvotes = ['system1', 'system2', 'system3'];
        const neededUpvotes = systemUpvotes.slice(0, 3 - upvotes.length);
        
        return updateDoc(doc(db, 'songs', songDoc.id), {
          upvotes: [...upvotes, ...neededUpvotes]
        });
      }
    });
    
    await Promise.all(updatePromises.filter(Boolean));
    return true;
  } catch (error) {
    console.error('Error auto-verifying songs:', error);
    throw error;
  }
};

// Archive a song
export const archiveSong = async (songId: string) => {
  try {
    const songRef = doc(db, 'songs', songId);
    await updateDoc(songRef, {
      isArchived: true,
      archivedAt: new Date().toISOString(),
      archivedReason: 'Received -3 net votes'
    });
    return true;
  } catch (error) {
    console.error('Error archiving song:', error);
    throw error;
  }
};

export const upvoteSong = async (songId: string, userId: string) => {
  const songRef = doc(db, 'songs', songId);
  const userRef = doc(db, 'users', userId);
  const songDoc = await getDoc(songRef);
  const songData = songDoc.data();
  const now = new Date().toISOString();

  // Prepare new upvotes/downvotes objects
  const upvotes = { ...(songData?.upvotes || {}) };
  const downvotes = { ...(songData?.downvotes || {}) };

  // Toggle upvote
  if (upvotes[userId]) {
    delete upvotes[userId];
  } else {
    upvotes[userId] = now;
    delete downvotes[userId];
  }

  // Calculate net votes
  const netVotes = Object.keys(upvotes).length - Object.keys(downvotes).length;

  const updateData: any = {
    upvotes,
    downvotes
  };

  if (netVotes >= 3 && songData.verificationStatus !== 'verified') {
    updateData.verificationStatus = 'verified';
    updateData.verifiedAt = now;
  } else if (netVotes < 3 && songData.verificationStatus === 'verified') {
    updateData.verificationStatus = 'pending';
    updateData.verifiedAt = null;
  }

  await updateDoc(songRef, updateData);

  await updateDoc(userRef, {
    points: increment(1)
  });
};

export const downvoteSong = async (songId: string, userId: string) => {
  const songRef = doc(db, 'songs', songId);
  const songDoc = await getDoc(songRef);
  const songData = songDoc.data();
  const now = new Date().toISOString();

  // Prepare new upvotes/downvotes objects
  const upvotes = { ...(songData?.upvotes || {}) };
  const downvotes = { ...(songData?.downvotes || {}) };

  // Toggle downvote
  if (downvotes[userId]) {
    delete downvotes[userId];
  } else {
    downvotes[userId] = now;
    delete upvotes[userId];
  }

  // Calculate net votes
  const netVotes = Object.keys(upvotes).length - Object.keys(downvotes).length;

  const updateData: any = {
    upvotes,
    downvotes
  };

  if (netVotes >= 3 && songData.verificationStatus !== 'verified') {
    updateData.verificationStatus = 'verified';
    updateData.verifiedAt = now;
  } else if (netVotes < 3 && songData.verificationStatus === 'verified') {
    updateData.verificationStatus = 'pending';
    updateData.verifiedAt = null;
  }

  await updateDoc(songRef, updateData);
};
