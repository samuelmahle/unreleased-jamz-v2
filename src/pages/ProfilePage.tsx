import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { updatePassword } from 'firebase/auth';

interface ProfileData {
  username: string;
  email: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user?.profileData) {
      setProfileData(user.profileData as ProfileData);
      setNewUsername(user.profileData.username);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Update username in Firestore
      if (newUsername !== profileData?.username) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          username: newUsername,
        });
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
        await updatePassword(user.firebaseUser, newPassword);
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profileData) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-music hover:bg-music-light text-white"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>
      
      <div className="space-y-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 rounded-lg border">
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium mb-2">Email</label>
            <Input
              type="email"
              value={profileData.email}
              disabled
              className="bg-background border-input"
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-2">Username</label>
            <Input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              disabled={!isEditing}
              className="bg-background border-input"
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-2">
              {isEditing ? "New Password" : "Password"}
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={isEditing ? "Enter new password" : "••••••••"}
              disabled={!isEditing}
              className="bg-background border-input"
            />
          </div>

          {isEditing && (
            <div>
              <label className="block text-base font-medium mb-2">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-background border-input"
              />
            </div>
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