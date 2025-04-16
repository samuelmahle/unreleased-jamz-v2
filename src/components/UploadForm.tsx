import React, { useState, FormEvent } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, Music, Image as ImageIcon } from "lucide-react";
import { Song } from "@/types/song";
import { uploadSong } from '../lib/songs';

interface UploadFormProps {
  onSongUpload: (song: Song) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onSongUpload }) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    genre: "",
    releaseDate: "",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      toast({
        title: "Error",
        description: "Please select an audio file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    // In a real app, you would upload files to a server here
    // This is a mock implementation
    setTimeout(() => {
      const newSong: Song = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title || audioFile.name.replace(/\.[^/.]+$/, ""),
        artist: formData.artist || "Unknown Artist",
        genre: formData.genre || "Undefined",
        releaseDate: formData.releaseDate || new Date().toISOString(),
        audioUrl: URL.createObjectURL(audioFile),
        imageUrl: imagePreview || undefined,
        isFavorite: false,
        uploadDate: new Date().toISOString(),
      };
      
      onSongUpload(newSong);
      setIsUploading(false);
      
      // Reset form
      setFormData({
        title: "",
        artist: "",
        genre: "",
        releaseDate: "",
      });
      setAudioFile(null);
      setImageFile(null);
      setImagePreview(null);
      
      toast({
        title: "Success!",
        description: "Your track has been uploaded",
      });
      
    }, 1500);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-music-surface">
      <CardHeader>
        <CardTitle>Upload Unreleased Track</CardTitle>
        <CardDescription>Share your music with the community</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">Track Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter track title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="artist">Artist Name</Label>
              <Input
                id="artist"
                name="artist"
                placeholder="Enter artist name"
                value={formData.artist}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                name="genre"
                placeholder="Enter genre"
                value={formData.genre}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="releaseDate">Expected Release Date</Label>
              <Input
                id="releaseDate"
                name="releaseDate"
                type="date"
                value={formData.releaseDate}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="audioFile">Audio File</Label>
              <div className="flex items-center gap-2">
                <Label 
                  htmlFor="audioFile" 
                  className="flex flex-1 cursor-pointer border border-dashed rounded-md p-4 items-center justify-center gap-2 hover:border-primary transition-colors"
                >
                  <Music className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {audioFile ? audioFile.name : "Select audio file"}
                  </span>
                </Label>
                <Input
                  id="audioFile"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioFileChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="imageFile">Cover Image (optional)</Label>
              <div className="flex items-center gap-2">
                <Label 
                  htmlFor="imageFile" 
                  className="flex flex-1 cursor-pointer border border-dashed rounded-md p-4 items-center justify-center gap-2 hover:border-primary transition-colors"
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Cover preview" 
                      className="h-20 w-20 object-cover rounded-md" 
                    />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Select cover image
                      </span>
                    </>
                  )}
                </Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
              </div>
            </div>
          </div>
          
          <CardFooter className="px-0 pt-4">
            <Button 
              type="submit" 
              className="w-full bg-music hover:bg-music-light" 
              disabled={isUploading || !audioFile}
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                  Uploading...
                </div>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload Track
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadForm;
