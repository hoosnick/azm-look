import React from "react";
import { Image as ImageIcon } from "lucide-react";

interface Props {
  onImageUpload: (file: File) => void;
}

const ImageUpload: React.FC<Props> = ({ onImageUpload }) => {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Video */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black z-10" />
        <video
          autoPlay
          playsInline
          loop
          muted
          className="w-full h-full object-cover opacity-40 md:opacity-60"
          poster="https://dev-cdn.nufa.ai/web/paywall-poster.jpg"
        >
          <source
            src="https://dev-cdn.nufa.ai/web/paywall.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-20 min-h-screen md:flex md:items-center md:px-6">
        <div className="flex flex-col items-center justify-center min-h-screen px-4 md:w-1/2 md:items-start">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center md:text-left">
            Transform Your Look
          </h2>
          <p className="text-white/60 mb-8 text-center md:text-left">
            Experience AI-powered photo transformation
          </p>

          <label className="ios-button flex items-center gap-2 cursor-pointer bg-purple-500 hover:bg-purple-600">
            <ImageIcon className="w-5 h-5" />
            <span>Choose from Gallery</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
