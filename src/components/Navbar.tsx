import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Music, Home, Heart, Upload, User, LogOut, Info, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { logoutUser } from "@/lib/firebase";
import { toast } from "sonner";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isAdmin } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to log out");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#121212] border-b border-[#282828] px-4 flex items-center justify-between z-50">
        <div className="flex items-center w-full">
          <Music className="h-6 w-6 text-purple-500" />
          <h1 className="text-lg font-bold ml-2 text-white">Setlisted</h1>
          <form onSubmit={handleSearch} className="flex-1 ml-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#282828] border-none text-white placeholder-gray-400 rounded-full focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:flex lg:flex-col lg:top-0 lg:left-0 lg:w-64 lg:h-screen bg-[#121212] border-r border-[#282828] p-4">
        <div className="flex items-center mb-6">
          <Music className="h-8 w-8 text-purple-500" />
          <h1 className="text-xl font-bold ml-2 text-white">Setlisted</h1>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#282828] border-none text-white placeholder-gray-400 rounded-full focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </form>

        <nav className="flex-1 space-y-1">
          <Link to="/">
            <Button
              variant="ghost"
              className={`w-full justify-start text-md font-normal ${
                isActive('/') ? 'text-purple-500 bg-[#282828]' : 'text-gray-300 hover:text-white hover:bg-[#282828]'
              }`}
            >
              <Home className="mr-2 h-5 w-5" />
              Home
            </Button>
          </Link>

          <Link to="/about">
            <Button
              variant="ghost"
              className={`w-full justify-start text-md font-normal ${
                isActive('/about') ? 'text-purple-500 bg-[#282828]' : 'text-gray-300 hover:text-white hover:bg-[#282828]'
              }`}
            >
              <Info className="mr-2 h-5 w-5" />
              About
            </Button>
          </Link>

          {currentUser ? (
            <>
              <Link to="/favorites">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-md font-normal ${
                    isActive('/favorites') ? 'text-purple-500 bg-[#282828]' : 'text-gray-300 hover:text-white hover:bg-[#282828]'
                  }`}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Favorites
                </Button>
              </Link>

              <Link to="/suggestions">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-md font-normal ${
                    isActive('/suggestions') ? 'text-purple-500 bg-[#282828]' : 'text-gray-300 hover:text-white hover:bg-[#282828]'
                  }`}
                >
                  <Clock className="mr-2 h-5 w-5" />
                  Pending Songs
                </Button>
              </Link>

              <Link to="/upload">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-md font-normal ${
                    isActive('/upload') ? 'text-purple-500 bg-[#282828]' : 'text-gray-300 hover:text-white hover:bg-[#282828]'
                  }`}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Music
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-md font-normal ${
                    isActive('/login') ? 'text-purple-500 bg-[#282828]' : 'text-gray-300 hover:text-white hover:bg-[#282828]'
                  }`}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Login
                </Button>
              </Link>
            </>
          )}
        </nav>

        {currentUser && (
          <div className="mt-auto pt-4 space-y-1 border-t border-[#282828]">
            <Link to="/profile">
              <Button
                variant="ghost"
                className={`w-full justify-start text-md font-normal ${
                  isActive('/profile') ? 'text-purple-500 bg-[#282828]' : 'text-gray-300 hover:text-white hover:bg-[#282828]'
                }`}
              >
                <User className="mr-2 h-5 w-5" />
                Profile
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;
