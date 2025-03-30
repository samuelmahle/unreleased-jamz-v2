
import React from "react";
import UploadForm from "@/components/UploadForm";

interface UploadPageProps {
  onSongUpload: (song: Song) => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onSongUpload }) => {
  return (
    <div className="pt-6 pb-32">
      <h1 className="text-3xl font-bold mb-8">Upload Track</h1>
      <UploadForm onSongUpload={onSongUpload} />
    </div>
  );
};

export default UploadPage;
