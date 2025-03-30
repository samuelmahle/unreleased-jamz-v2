
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Music, Search, Upload, Library, Home, LogIn, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/firebase";
import { toast } from "sonner";

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
    <div className="fixed top-0 left-0 w-64 h-full bg-music-surface border-r border-border p-4 flex flex-col">
      <div className="flex items-center mb-8">
        <Music className="h-8 w-8 text-music" />
        <h1 className="text-xl font-bold ml-2">Unreleased Jamz</h1>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search songs..."
            className="pl-8 bg-secondary"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      
      <nav className="space-y-1">
        <Link to="/">
          <Button
            variant="ghost"
            className="w-full justify-start text-md font-normal"
          >
            <Home className="mr-2 h-5 w-5" />
            Home
          </Button>
        </Link>
        <Link to="/library">
          <Button
            variant="ghost"
            className="w-full justify-start text-md font-normal"
          >
            <Library className="mr-2 h-5 w-5" />
            Library
          </Button>
        </Link>
        <Link to="/upload">
          <Button
            variant="ghost"
            className="w-full justify-start text-md font-normal"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Music
          </Button>
        </Link>

        {!currentUser ? (
          <>
            <Link to="/login">
              <Button
                variant="ghost"
                className="w-full justify-start text-md font-normal"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="ghost"
                className="w-full justify-start text-md font-normal"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Register
              </Button>
            </Link>
          </>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-md font-normal"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        )}
      </nav>
      
      <div className="mt-auto">
        {currentUser ? (
          <div className="p-3 bg-secondary rounded-md mb-3">
            <p className="text-sm font-medium truncate">{currentUser.email}</p>
            <p className="text-xs text-muted-foreground">Logged In</p>
          </div>
        ) : null}

        <Button className="w-full bg-music hover:bg-music-light">
          <Upload className="mr-2 h-5 w-5" /> Upload Track
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
