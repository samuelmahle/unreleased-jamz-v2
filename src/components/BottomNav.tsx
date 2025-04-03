import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#282828] h-[4.5rem] flex items-center justify-around sm:hidden">
      <Link 
        to="/" 
        className={`flex flex-col items-center ${
          location.pathname === '/' ? 'text-music-accent' : 'text-gray-400'
        }`}
      >
        <Home className="h-6 w-6" />
        <span className="text-xs mt-1">Home</span>
      </Link>
      <Link 
        to="/favorites" 
        className={`flex flex-col items-center ${
          location.pathname === '/favorites' ? 'text-music-accent' : 'text-gray-400'
        }`}
      >
        <Heart className="h-6 w-6" />
        <span className="text-xs mt-1">Favorites</span>
      </Link>
    </nav>
  );
};

export default BottomNav; 