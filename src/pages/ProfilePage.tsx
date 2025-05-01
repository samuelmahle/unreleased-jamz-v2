import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { updatePassword } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setNewUsername(userData.username || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updates: any = {};

      // Update username if changed
      if (newUsername && newUsername !== currentUser.profileData?.username) {
        updates.username = newUsername;
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        if (newPassword.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        await updatePassword(currentUser, newPassword);
        toast.success('Password updated successfully');
      }

      // Only update Firestore if there are changes
      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
        toast.success('Profile updated successfully');
      }

      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-music"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-400">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="outline"
          className="hover:bg-gray-800"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>
      
      <div className="space-y-6 bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
        {/* User Stats Section */}
        <div className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-music text-music">
              {currentUser.profileData?.role || 'User'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">
              {currentUser.profileData?.points || 0} points
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium mb-2">Email</label>
            <Input
              type="email"
              value={currentUser.email || ''}
              disabled
              className="bg-gray-800/50 border-gray-700"
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-2">Username</label>
            <Input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              disabled={!isEditing}
              className="bg-gray-800/50 border-gray-700"
            />
          </div>

          {isEditing && (
            <>
              <div>
                <label className="block text-base font-medium mb-2">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>

              <div>
                <label className="block text-base font-medium mb-2">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>
            </>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end">
            <Button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="bg-music hover:bg-music-light text-white"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 