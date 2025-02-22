import React, { useRef } from "react";
import { Download, Loader2, ImagePlus } from "lucide-react";
import { ImageState, Filter } from "../types";

interface Props {
  imageState: ImageState;
  filters: Filter[];
  selectedFilter: Filter | null;
  onFilterSelect: (filter: Filter) => void;
  onDownload: () => void;
  onReset: () => void;
}

const Editor: React.FC<Props> = ({
  imageState,
  filters,
  selectedFilter,
  onFilterSelect,
  onDownload,
  onReset,
}) => {
  const filterScrollRef = useRef<HTMLDivElement>(null);

  if (!imageState.original) return null;

  return (
    <div className="h-screen flex flex-col md:flex-row md:gap-6 md:p-6">
      {/* Image */}
      <div className="flex-1 h-screen md:h-full relative">
        <div className="absolute inset-0 p-4">
          <div className="ios-card h-full relative">
            {imageState.loading ? (
              <div className="absolute inset-0 flex items-center justify-center loading-blur z-10 rounded-2xl">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                  <p className="text-sm text-white/60">
                    Transforming your photo...
                  </p>
                </div>
              </div>
            ) : null}

            <div className="w-full h-full flex items-center justify-center">
              <img
                src={imageState.processed || imageState.original}
                alt="Image"
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            </div>

            {imageState.processed && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex gap-3">
                  <button
                    className="ios-button flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600"
                    onClick={onReset}
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>New Photo</span>
                  </button>

                  <button
                    className="ios-button flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600"
                    onClick={onDownload}
                  >
                    <Download className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-none md:w-72 h-[40vh] md:h-full">
        <div className="h-full md:ios-card md:p-4">
          <div ref={filterScrollRef} className="filter-scroll px-4 md:px-0">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="filter-item"
                onClick={() => onFilterSelect(filter)}
              >
                <div
                  className={`aspect-[3/4] relative rounded-xl overflow-hidden cursor-pointer ${
                    selectedFilter?.id === filter.id
                      ? "ring-2 ring-purple-500"
                      : ""
                  }`}
                >
                  <img
                    src={filter.image}
                    alt="Filter preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
