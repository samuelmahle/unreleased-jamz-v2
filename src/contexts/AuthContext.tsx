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
import { app, db, loginUser, logoutUser, ensureSuperAdmin } from "../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { UserRole } from "../types/user";
import { toast } from "sonner";

interface UserProfile {
  username: string;
  email: string;
  isPublic: boolean;
  uploadCount: number;
  createdAt: string;
  isArtist: boolean;
  isVerified: boolean;
  role: UserRole;
  points: number;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    soundcloud?: string;
    website?: string;
  };
  followers: string[];
  following: string[];
  favorites?: string[];
}

interface AuthUser extends User {
  profileData?: UserProfile;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  auth: Auth;
  userFavorites: string[];
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: (user: User) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
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
        const authUser: AuthUser = Object.assign(user, { profileData: userData });
        setCurrentUser(authUser);
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
      }
      setLoading(false);
      
      // Ensure super admin status when user logs in
      if (user && user.email === 'sam18mahle@gmail.com') {
        ensureSuperAdmin(user.uid, user.email)
          .catch(error => console.error('Error ensuring super admin:', error));
      }
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
        
        // Ensure favorites is always an array
        const favorites = Array.isArray(userData.favorites) ? userData.favorites : [];
        setUserFavorites(favorites);
        
        // Update profile data when it changes
        const updatedUser: AuthUser = Object.assign({}, currentUser, { 
          profileData: {
            ...userData,
            favorites: favorites
          }
        });
        setCurrentUser(updatedUser);
      } else {
        console.log('No user document exists');
        setUserFavorites([]);
      }
    }, (error) => {
      console.error('Error in user data listener:', error);
      toast.error('Failed to sync favorites');
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user.email === 'sam18mahle@gmail.com') {
        await ensureSuperAdmin(result.user.uid, result.user.email);
      }
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in');
      throw error;
    }
  };

  const logout = async () => {
    try {
    await signOut(auth);
      toast.success('Successfully logged out!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
      throw error;
    }
  };

  const sendVerificationEmail = async (user: User) => {
    await sendEmailVerification(user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    auth,
    userFavorites,
    register,
    login,
    logout,
    sendVerificationEmail,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
