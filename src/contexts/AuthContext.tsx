
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, getFavorites } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  userFavorites: string[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  userFavorites: [],
  loading: true 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user favorites
        const favorites = await getFavorites(user.uid);
        setUserFavorites(favorites);
      } else {
        setUserFavorites([]);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userFavorites,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
