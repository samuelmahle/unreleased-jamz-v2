import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  onSearch: (term: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder="Search songs..."
        className="w-full pl-9 bg-[#282828] border-none text-gray-300 placeholder:text-gray-500 focus-visible:ring-0"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}; 