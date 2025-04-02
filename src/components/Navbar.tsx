import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Music, Search, Upload, Heart, Home, LogIn, UserPlus, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="fixed top-0 left-0 w-64 h-screen bg-[#121212] border-r border-[#282828] p-4">
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-6">
          <Music className="h-8 w-8 text-purple-500" />
          <h1 className="text-xl font-bold ml-2 text-white">Unreleased Jamz</h1>
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
          <div className="mt-auto pt-4 space-y-1 border-t border-[#282828]">
            <Link to="/profile">
              <Button
                variant="ghost"
                className="w-full justify-start text-md font-normal text-gray-300 hover:text-white hover:bg-[#282828]"
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
    </div>
  );
};

export default Navbar;
