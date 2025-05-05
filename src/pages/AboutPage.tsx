import React from 'react';
import { Music } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Music className="h-8 w-8 text-music" />
        <h1 className="text-3xl font-bold text-center">About Setlisted</h1>
      </div>
      
      <div className="prose prose-invert mx-auto">
        <p className="text-lg leading-relaxed text-gray-300">
          The idea for Setlisted came one night while a few friends were digging through YouTube sets, searching for old IDs. Our goal is to create a space where music enthusiasts can discover, track, and celebrate their favorite unreleased tracks. Untz untz on
        </p>
        
        <p className="text-gray-400 mt-8 text-right italic">
          — the Setlisted team
        </p>
      </div>
    </div>
  );
};

export default AboutPage; 