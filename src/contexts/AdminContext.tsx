import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManageUsers: boolean;
  canManageContent: boolean;
  canDeleteContent: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      // Check if user is super admin
      if (currentUser.email === 'sam18mahle@gmail.com') {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        return;
      }

      // Check if user is regular admin
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      setIsAdmin(userData?.role === 'admin' || userData?.role === 'super_admin');
      setIsSuperAdmin(userData?.role === 'super_admin');
    };

    checkAdminStatus();
  }, [currentUser]);

  const value = {
    isAdmin,
    isSuperAdmin,
    canManageUsers: isAdmin || isSuperAdmin,
    canManageContent: isAdmin || isSuperAdmin,
    canDeleteContent: isSuperAdmin
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext; 