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
          Setlisted is the premier destination for music enthusiasts to discover, track, and celebrate their favorite unreleased tracks. With personalized watchlists and real‑time drop alerts, you'll never miss the next big release. We're a passionate collective of music obsessives and tech innovators—and we built Setlisted to bring the thrill of tomorrow's hits straight to you.
        </p>
        
        <p className="text-gray-400 mt-8 text-right italic">
          — the Setlisted team
        </p>
      </div>
    </div>
  );
};

export default AboutPage; 