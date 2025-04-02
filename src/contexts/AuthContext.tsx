import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, getFavorites } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  username: string;
  email: string;
  createdAt: string;
  uploadCount: number;
  isPublic: boolean;
  firebaseUser: User;
  uid: string;
  profileData: any;
}

interface AuthContextType {
  currentUser: User | null;
  userFavorites: string[];
  loading: boolean;
  user: UserProfile | null;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  userFavorites: [],
  loading: true,
  user: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      
      if (firebaseUser) {
        // Get user favorites
        const favorites = await getFavorites(firebaseUser.uid);
        setUserFavorites(favorites);

        // Get user profile data
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            ...userData,
            firebaseUser,
            uid: firebaseUser.uid,
            profileData: userData
          } as UserProfile);
        }
      } else {
        setUserFavorites([]);
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userFavorites,
    loading,
    user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
