import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AboutPage = () => {
  const { userPoints, userRole } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-4">About Unreleased Jamz</h1>
        <p className="text-gray-300 leading-relaxed">
          Welcome to Unreleased Jamz, your premier destination for discovering and sharing unreleased music. 
          Our platform is built by music enthusiasts for music enthusiasts, creating a community where fans 
          can explore, verify, and discuss upcoming releases and rare tracks.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">How It Works</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium mb-2">Song Verification</h3>
            <p className="text-gray-300">
              Our community-driven verification system ensures the authenticity of uploaded tracks. 
              Songs need to receive 3 net upvotes (upvotes minus downvotes) to become verified. 
              This helps maintain the quality and legitimacy of our music collection.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-medium mb-2">Points System</h3>
            <p className="text-gray-300">
              Earn points by contributing to the community:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1">
              <li>Upload a song: 100 points</li>
              <li>Song gets verified: 200 points</li>
              <li>Upvote a song: 10 points</li>
              <li>Report invalid content: 50 points</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-medium mb-2">User Roles</h3>
            <p className="text-gray-300">
              Progress through our role system as you contribute:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1">
              <li>New User: Starting role</li>
              <li>Verified Contributor (1000+ points): Can edit song information</li>
              <li>Admin: Manages content and user reports</li>
              <li>Super Admin: Full platform control</li>
            </ul>
          </div>
        </div>
      </section>

      {userPoints > 0 && (
        <section className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-3">Your Status</h2>
          <div className="space-y-2">
            <p className="text-gray-300">Current Points: <span className="text-music font-medium">{userPoints}</span></p>
            <p className="text-gray-300">Role: <span className="text-music font-medium">{userRole}</span></p>
            {userRole === 'user' && (
              <p className="text-gray-400 text-sm">
                Need {1000 - userPoints} more points to become a Verified Contributor
              </p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-3">Community Guidelines</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Only upload unreleased or rare music content</li>
          <li>Respect copyright and intellectual property rights</li>
          <li>Provide accurate information when uploading songs</li>
          <li>Help maintain quality by reporting incorrect information</li>
          <li>Be respectful and constructive in discussions</li>
        </ul>
      </section>
    </div>
  );
};

export default AboutPage; 