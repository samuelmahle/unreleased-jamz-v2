
import React from "react";
import { Link } from "react-router-dom";
import { Music, Search, Upload, Library, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  onSearch: (term: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
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
      </nav>
      
      <div className="mt-auto">
        <Button className="w-full bg-music hover:bg-music-light">
          <Upload className="mr-2 h-5 w-5" /> Upload Track
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
