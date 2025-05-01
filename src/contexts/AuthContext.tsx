import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  Auth,
  getAuth,
  sendPasswordResetEmail
} from "firebase/auth";
import { app, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

interface UserProfile {
  username: string;
  email: string;
  isPublic: boolean;
  uploadCount: number;
  createdAt: string;
  isArtist: boolean;
  isVerified: boolean;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    soundcloud?: string;
    website?: string;
  };
  followers: string[];
  following: string[];
}

interface AuthUser extends User {
  profileData?: UserProfile;
  points?: number;
  role?: 'user' | 'verified_contributor' | 'admin' | 'super_admin';
  favorites?: string[];
}

interface AuthContextType {
  currentUser: AuthUser | null;
  auth: Auth;
  userFavorites: string[];
  userPoints: number;
  userRole: string;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: (user: User) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  toggleFavorite: (songId: string) => Promise<void>;
  addPoints: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  // Load user profile data
  const loadUserProfile = async (user: User) => {
    console.log('Loading user profile for:', user.uid);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        console.log('User profile loaded:', {
          following: userData.following?.length || 0,
          followers: userData.followers?.length || 0,
          favorites: userData.favorites?.length || 0
        });
        const authUser: AuthUser = Object.assign(user, { 
          profileData: userData,
          points: userData.points || 0,
          role: userData.role || 'user',
          favorites: userData.favorites || []
        });
        setCurrentUser(authUser);
        setUserFavorites(userData.favorites || []);
        setUserPoints(userData.points || 0);
        setUserRole(userData.role || 'user');
      } else {
        console.log('No user profile document exists');
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setCurrentUser(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        await loadUserProfile(user);
      } else {
        setCurrentUser(null);
        setUserFavorites([]);
        setUserPoints(0);
        setUserRole('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  // Listen for changes to user data
  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, clearing favorites');
      setUserFavorites([]);
      return;
    }

    console.log('Setting up user data listener for:', currentUser.uid);
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data() as UserProfile;
        console.log('User data updated:', {
          favorites: userData.favorites?.length || 0,
          following: userData.following?.length || 0
        });
        setUserFavorites(doc.data().favorites || []);
        // Update profile data when it changes
        const updatedUser: AuthUser = Object.assign({}, currentUser, { 
          profileData: userData,
          points: userData.points || 0,
          role: userData.role || 'user',
          favorites: userData.favorites || []
        });
        setCurrentUser(updatedUser);
        setUserPoints(userData.points || 0);
        setUserRole(userData.role || 'user');
      } else {
        console.log('No user document exists');
        setUserFavorites([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const register = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      points: 0,
      role: 'user',
      favorites: [],
      createdAt: new Date()
    });
  };

  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        points: 0,
        role: 'user',
        favorites: [],
        createdAt: new Date()
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendVerificationEmail = async (user: User) => {
    await sendEmailVerification(user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const toggleFavorite = async (songId: string) => {
    if (!currentUser) throw new Error('Must be logged in to favorite songs');

    const userRef = doc(db, 'users', currentUser.uid);
    const isFavorited = userFavorites.includes(songId);

    if (isFavorited) {
      await updateDoc(userRef, {
        favorites: arrayRemove(songId)
      });
      setUserFavorites(prev => prev.filter(id => id !== songId));
    } else {
      await updateDoc(userRef, {
        favorites: arrayUnion(songId)
      });
      setUserFavorites(prev => [...prev, songId]);
    }

    return !isFavorited;
  };

  const addPoints = async (amount: number) => {
    if (!currentUser) return;

    const newPoints = userPoints + amount;
    const userRef = doc(db, 'users', currentUser.uid);
    
    await updateDoc(userRef, {
      points: newPoints
    });
    
    setUserPoints(newPoints);

    // Check for role upgrades based on points
    if (newPoints >= 1000 && userRole === 'user') {
      await updateDoc(userRef, { role: 'verified_contributor' });
      setUserRole('verified_contributor');
    }
  };

  const value = {
    currentUser,
    auth,
    userFavorites,
    userPoints,
    userRole,
    register,
    login,
    logout,
    sendVerificationEmail,
    resetPassword,
    toggleFavorite,
    addPoints
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
