import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Loader2,
  ImagePlus,
  Upload,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { ImageState, Filter } from "../types";

interface Props {
  imageState: ImageState;
  filters: Filter[];
  selectedFilter: Filter | null;
  onFilterSelect: (filter: Filter) => void;
  onDownload: () => void;
  onImageUpload: (file: File) => void;
}

const Sparkle = ({
  left,
  top,
  animationDelay,
}: {
  left: string;
  top: string;
  animationDelay: string;
}) => (
  <div
    className="absolute w-2 h-2 bg-purple-500 rounded-full opacity-0 animate-sparkle"
    style={{ left, top, animationDelay }}
  />
);

const Editor: React.FC<Props> = ({
  imageState,
  filters,
  selectedFilter,
  onFilterSelect,
  onDownload,
  onImageUpload,
}) => {
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dividerPosition, setDividerPosition] = useState(50);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const generateSparkles = (count: number) => {
    return new Array(count).fill(null).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
    }));
  };

  const [sparkles, setSparkles] = useState(generateSparkles(15));

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles(generateSparkles(15));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleDrag = (e: React.DragEvent) => e.preventDefault();
  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onImageUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startPos = dividerPosition;

    const onMouseMove = (e: MouseEvent) => {
      const delta = ((e.clientX - startX) / window.innerWidth) * 100;
      setDividerPosition(Math.max(0, Math.min(100, startPos + delta)));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startPos = dividerPosition;

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const delta = ((touch.clientX - startX) / window.innerWidth) * 100;
      setDividerPosition(Math.max(0, Math.min(100, startPos + delta)));
    };

    const onTouchEnd = () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };

    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 150;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleFilterClick = (filter: Filter) => {
    if (imageState.loading) {
      setShowConfirmDialog(true);
    } else {
      onFilterSelect(filter);
    }
  };

  if (!imageState.original) {
    return (
      <div
        className="h-screen flex items-center justify-center p-4"
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
      >
        <div
          className={`ios-card w-full max-w-md p-8 text-center ${
            isDragging ? "border-2 border-purple-500" : ""
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-purple-500" />
          <h3 className="text-xl font-bold mb-4">Upload your photo</h3>
          <p className="text-white/60 mb-6">
            Drag and drop your photo here or click to choose
          </p>
          <label className="ios-button inline-flex items-center gap-2 cursor-pointer bg-purple-500 hover:bg-purple-600">
            <ImagePlus className="w-5 h-5" />
            <span>Choose Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
      {/* Image Comparison */}
      <div className="flex-1 h-screen md:h-full flex justify-center items-center relative">
        <div className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden select-none bg-black">
          {/* Container for both images */}
          <div className="relative w-full h-full">
            {/* Original Image */}
            <img
              src={imageState.original}
              alt="Original"
              className="relative top-0 left-0 w-full h-full object-cover"
            />

            {/* Processed Image Overlay */}
            {imageState.processed && (
              <div
                className="absolute top-0 left-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - dividerPosition}% 0 0)` }}
              >
                <img
                  src={imageState.processed}
                  alt="Processed"
                  id="processed-image"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Draggable Divider */}
            {imageState.processed && (
              <div
                className="absolute inset-y-0 w-1 bg-white cursor-ew-resize"
                style={{ left: `${dividerPosition}%` }}
              >
                <div
                  className="absolute top-1/2 left-1/2 w-6 h-6 bg-white rounded-full border border-gray-500 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                />
              </div>
            )}
          </div>

          {/* Loading Overlay */}
          {imageState.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-2xl">
              {sparkles.map((sparkle) => (
                <Sparkle
                  key={sparkle.id}
                  left={sparkle.left}
                  top={sparkle.top}
                  animationDelay={sparkle.animationDelay}
                />
              ))}

              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm text-white ml-2">
                Transforming your photo...
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-1 flex gap-3">
          <label className="ios-button flex items-center gap-2 cursor-pointer bg-purple-500 hover:bg-purple-600">
            <ImagePlus className="w-4 h-4" />
            <span>New Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          {imageState.processed && (
            <button
              className="ios-button flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
              onClick={onDownload}
            >
              <Download className="w-4 h-4" />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="w-full md:w-96 h-[60vh] md:h-full overflow-auto scrollbar-hide">
        <div className="ios-card p-4">
          {/* Category Navigation - PC Only */}
          <div className="relative hidden md:flex items-center">
            <button
              className="absolute left-0 bg-gray-900 p-2 rounded-full shadow-lg hover:bg-gray-700 transition"
              onClick={() => scrollCategories("left")}
            >
              <ChevronLeft className="w-3 h-3 text-white" />
            </button>

            {/* Category Buttons */}
            <div
              ref={categoryScrollRef}
              className="flex gap-3 mb-4 mr-5 ml-5 overflow-x-auto scrollbar-hide px-4"
            >
              <button
                className={`px-4 py-2 rounded-lg text-sm ${
                  selectedCategory === null
                    ? "bg-purple-500 text-white"
                    : "bg-gray-800 text-gray-300"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {[...new Set(filters.map((filter) => filter.category))].map(
                (category) => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      selectedCategory === category
                        ? "bg-purple-500 text-white"
                        : "bg-gray-800 text-gray-300"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                )
              )}
            </div>

            <button
              className="absolute right-0 bg-gray-900 p-2 rounded-full shadow-lg hover:bg-gray-700 transition"
              onClick={() => scrollCategories("right")}
            >
              <ChevronRight className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Mobile Category Buttons */}
          <div className="flex md:hidden gap-3 mb-4 overflow-x-auto scrollbar-hide">
            <button
              className={`px-4 py-2 rounded-lg text-sm ${
                selectedCategory === null
                  ? "bg-purple-500 text-white"
                  : "bg-gray-800 text-gray-300"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {[...new Set(filters.map((filter) => filter.category))].map(
              (category) => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    selectedCategory === category
                      ? "bg-purple-500 text-white"
                      : "bg-gray-800 text-gray-300"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              )
            )}
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
            {filters
              .filter(
                (filter) =>
                  !selectedCategory || filter.category === selectedCategory
              )
              .map((filter) => (
                <div
                  key={filter.id}
                  className={`aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition ${
                    selectedFilter?.id === filter.id
                      ? "ring-2 ring-purple-500"
                      : ""
                  }`}
                  onClick={() => handleFilterClick(filter)}
                >
                  <img
                    src={filter.image}
                    alt={filter.id}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="ios-card p-6 text-center">
            <p className="text-lg">
              You can't change the filter while the image is processing.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                className="ios-button bg-gray-500"
                onClick={() => setShowConfirmDialog(false)}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
