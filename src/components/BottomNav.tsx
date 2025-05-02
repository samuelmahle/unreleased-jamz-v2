import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Upload, User, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#282828]">
      <div className="flex justify-around items-center h-16">
        <Link
          to="/"
          className={cn(
            "flex flex-col items-center gap-1 text-sm",
            isActive('/') ? "text-purple-500" : "text-gray-400"
          )}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        {currentUser ? (
          <>
            <Link
              to="/favorites"
              className={cn(
                "flex flex-col items-center gap-1 text-sm",
                isActive('/favorites') ? "text-purple-500" : "text-gray-400"
              )}
            >
              <Heart className="h-5 w-5" />
              <span>Favorites</span>
            </Link>

            <Link
              to="/suggestions"
              className={cn(
                "flex flex-col items-center gap-1 text-sm",
                isActive('/suggestions') ? "text-purple-500" : "text-gray-400"
              )}
            >
              <Clock className="h-5 w-5" />
              <span>Pending</span>
            </Link>

            <Link
              to="/upload"
              className={cn(
                "flex flex-col items-center gap-1 text-sm",
                isActive('/upload') ? "text-purple-500" : "text-gray-400"
              )}
            >
              <Upload className="h-5 w-5" />
              <span>Upload</span>
            </Link>
          </>
        ) : (
          <Link
            to="/about"
            className={cn(
              "flex flex-col items-center gap-1 text-sm",
              isActive('/about') ? "text-purple-500" : "text-gray-400"
            )}
          >
            <Info className="h-5 w-5" />
            <span>About</span>
          </Link>
        )}

        <Link
          to={currentUser ? "/profile" : "/login"}
          className={cn(
            "flex flex-col items-center gap-1 text-sm",
            (isActive('/profile') || isActive('/login')) ? "text-purple-500" : "text-gray-400"
          )}
        >
          <User className="h-5 w-5" />
          <span>{currentUser ? "Profile" : "Login"}</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
