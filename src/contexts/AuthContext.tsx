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
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface UserProfile {
  username: string;
  email: string;
  isPublic: boolean;
  uploadCount: number;
  createdAt: string;
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
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        const authUser: AuthUser = Object.assign(user, { profileData: userData });
        setCurrentUser(authUser);
      } else {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setCurrentUser(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadUserProfile(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  // Listen for changes to user data
  useEffect(() => {
    if (!currentUser) {
      setUserFavorites([]);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data() as UserProfile;
        setUserFavorites(doc.data().favorites || []);
        // Update profile data when it changes
        const updatedUser: AuthUser = Object.assign({}, currentUser, { 
          profileData: userData 
        });
        setCurrentUser(updatedUser);
      } else {
        setUserFavorites([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]); // Only re-run when user ID changes

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
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

  const value = {
    currentUser,
    auth,
    userFavorites,
    register,
    login,
    logout,
    sendVerificationEmail,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
