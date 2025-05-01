import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Star, User as UserIcon } from 'lucide-react';

const ProfilePage = () => {
  const { currentUser, userPoints, userRole } = useAuth();
  const { isSuperAdmin } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);

  const getBadgeContent = () => {
    switch (userRole) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          icon: <Crown className="h-4 w-4 mr-1" />,
          color: 'bg-purple-500'
        };
      case 'admin':
        return {
          label: 'Admin',
          icon: <Shield className="h-4 w-4 mr-1" />,
          color: 'bg-blue-500'
        };
      case 'verified_contributor':
        return {
          label: 'Verified Contributor',
          icon: <Star className="h-4 w-4 mr-1" />,
          color: 'bg-green-500'
        };
      default:
        return {
          label: 'User',
          icon: <UserIcon className="h-4 w-4 mr-1" />,
          color: 'bg-gray-500'
        };
    }
  };

  const badge = getBadgeContent();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          className="bg-[#282828] text-white hover:bg-[#383838]"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <div className="space-y-8">
        <div className="bg-[#1c1c1c] rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Account Status</h2>
              <div className="flex items-center gap-4">
                <Badge 
                  className={`${badge.color} flex items-center px-3 py-1`}
                  variant="secondary"
                >
                  {badge.icon}
                  {badge.label}
                </Badge>
                <div className="text-sm text-gray-400">
                  {userPoints} points
                </div>
              </div>
            </div>
            {userRole === 'user' && (
              <div className="text-sm text-gray-400">
                {1000 - userPoints} points needed for Verified Contributor
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={currentUser?.email || ''}
                disabled={true}
                className="bg-[#282828] border-[#383838]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <Input
                type="text"
                value={currentUser?.displayName || ''}
                disabled={!isEditing}
                className="bg-[#282828] border-[#383838]"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#1c1c1c] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Points History</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Upload songs</span>
              <span>+100 points each</span>
            </div>
            <div className="flex justify-between">
              <span>Song verified</span>
              <span>+200 points</span>
            </div>
            <div className="flex justify-between">
              <span>Upvote songs</span>
              <span>+10 points each</span>
            </div>
            <div className="flex justify-between">
              <span>Report invalid content</span>
              <span>+50 points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 