import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Music, Search, Upload, Heart, Home, LogIn, UserPlus, LogOut, User, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/firebase";
import { toast } from "sonner";
import { SearchInput } from "./SearchInput";

interface NavbarProps {
  onSearch: (term: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "Failed to logout");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#121212] border-b border-[#282828] px-4 flex items-center justify-between z-50">
        <div className="flex items-center">
          <Music className="h-6 w-6 text-purple-500" />
          <h1 className="text-lg font-bold ml-2 text-white">Setlisted</h1>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="text-gray-300 hover:text-white"
        >
          <Search className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Search Bar */}
      <div className={`lg:hidden fixed top-16 left-0 right-0 bg-[#121212] border-b border-[#282828] p-4 transition-transform duration-300 z-40 ${showSearch ? 'translate-y-0' : '-translate-y-full'}`}>
        <SearchInput onSearch={onSearch} />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#121212] border-t border-[#282828] flex items-center justify-around z-50">
        <Link to="/" className="flex flex-col items-center">
          <div className={`p-2 rounded-lg ${isActive('/') ? 'bg-[#282828]' : ''}`}>
            <Home className={`h-6 w-6 ${isActive('/') ? 'text-purple-500' : 'text-gray-400'}`} />
          </div>
          <span className={`text-xs mt-0.5 ${isActive('/') ? 'text-purple-500' : 'text-gray-400'}`}>Home</span>
        </Link>

        {currentUser ? (
          <>
            <Link to="/favorites" className="flex flex-col items-center">
              <div className={`p-2 rounded-lg ${isActive('/favorites') ? 'bg-[#282828]' : ''}`}>
                <Heart className={`h-6 w-6 ${isActive('/favorites') ? 'text-purple-500' : 'text-gray-400'}`} />
              </div>
              <span className={`text-xs mt-0.5 ${isActive('/favorites') ? 'text-purple-500' : 'text-gray-400'}`}>Favorites</span>
            </Link>

            <Link to="/upload" className="flex flex-col items-center">
              <div className={`p-2 rounded-lg ${isActive('/upload') ? 'bg-[#282828]' : ''}`}>
                <Upload className={`h-6 w-6 ${isActive('/upload') ? 'text-purple-500' : 'text-gray-400'}`} />
              </div>
              <span className={`text-xs mt-0.5 ${isActive('/upload') ? 'text-purple-500' : 'text-gray-400'}`}>Upload</span>
            </Link>

            <Link to="/profile" className="flex flex-col items-center">
              <div className={`p-2 rounded-lg ${isActive('/profile') ? 'bg-[#282828]' : ''}`}>
                <User className={`h-6 w-6 ${isActive('/profile') ? 'text-purple-500' : 'text-gray-400'}`} />
              </div>
              <span className={`text-xs mt-0.5 ${isActive('/profile') ? 'text-purple-500' : 'text-gray-400'}`}>Profile</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="flex flex-col items-center">
              <div className={`p-2 rounded-lg ${isActive('/login') ? 'bg-[#282828]' : ''}`}>
                <LogIn className={`h-6 w-6 ${isActive('/login') ? 'text-purple-500' : 'text-gray-400'}`} />
              </div>
              <span className={`text-xs mt-0.5 ${isActive('/login') ? 'text-purple-500' : 'text-gray-400'}`}>Login</span>
            </Link>

            <Link to="/register" className="flex flex-col items-center">
              <div className={`p-2 rounded-lg ${isActive('/register') ? 'bg-[#282828]' : ''}`}>
                <UserPlus className={`h-6 w-6 ${isActive('/register') ? 'text-purple-500' : 'text-gray-400'}`} />
              </div>
              <span className={`text-xs mt-0.5 ${isActive('/register') ? 'text-purple-500' : 'text-gray-400'}`}>Register</span>
            </Link>
          </>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:flex lg:top-0 lg:left-0 lg:w-64 lg:h-screen bg-[#121212] border-r border-[#282828] p-4">
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center mb-6">
            <Music className="h-8 w-8 text-purple-500" />
            <h1 className="text-xl font-bold ml-2 text-white">Setlisted</h1>
          </div>

          <div className="mb-6">
            <SearchInput onSearch={onSearch} />
          </div>
          
          <nav className="space-y-1">
            <Link to="/">
              <Button
                variant="ghost"
                className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
              >
                <Home className="mr-2 h-5 w-5" />
                Home
              </Button>
            </Link>

            {currentUser && (
              <>
                <Link to="/favorites">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Favorites
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Music
                  </Button>
                </Link>
              </>
            )}

            <Link to="/about">
              <Button
                variant="ghost"
                className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
              >
                <Info className="mr-2 h-5 w-5" />
                About
              </Button>
            </Link>

            {!currentUser && (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {currentUser && (
            <div className="mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
