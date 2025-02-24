import { useState, useCallback } from "react";
import Landing from "./components/Landing";
import Editor from "./components/Editor";
import { Filter, ImageState } from "./types";
import { apiService } from "./services/api";

function App() {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    processed: null,
    loading: false,
    error: null,
    resourceId: null,
  });

  const handleError = useCallback((message: string, error: unknown) => {
    console.error(message, error);
    setImageState((prev) => ({
      ...prev,
      loading: false,
      error: message,
    }));
  }, []);

  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageState((prev) => ({
            ...prev,
            original: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(file);

        // Cleanup after file is loaded
        reader.onloadend = () => {
          reader.onload = null;
        };

        const blobFile = new Blob([new Uint8Array(await file.arrayBuffer())], {
          type: file.type,
        });

        const resourceId = await apiService.uploadImage(file, blobFile);
        setImageState((prev) => ({
          ...prev,
          resourceId,
          processed: null,
          error: null,
        }));
      } catch (error) {
        handleError("Failed to upload image", error);
      }
    },
    [handleError]
  );

  const handleFilterSelect = useCallback(
    async (filter: Filter) => {
      if (!imageState.resourceId) return;

      setSelectedFilter(filter);
      setImageState((prev) => ({
        ...prev,
        loading: true,
        processed: null,
        error: null,
      }));

      try {
        const actionId = await apiService.applyFilter(
          imageState.resourceId,
          filter.id
        );
        const processedImageUrl = await apiService.listenToProcessing(actionId);

        setImageState((prev) => ({
          ...prev,
          loading: false,
          processed: processedImageUrl,
          error: null,
        }));
      } catch (error) {
        handleError("Failed to process image", error);
      }
    },
    [imageState, handleError]
  );

  const handleDownload = useCallback(() => {
    if (imageState.processed) {
      const link = document.createElement("a");
      link.href = imageState.processed;
      link.download = "processed-image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [imageState.processed]);

  const handleGetStarted = useCallback(() => {
    const fetchFilters = async () => {
      try {
        const filters = await apiService.getFilters();
        setFilters(filters);
      } catch (error) {
        console.error("Failed to load filters:", error);
      }
    };
    fetchFilters();
    setIsEditorMode(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <main>
        {!isEditorMode ? (
          <Landing onGetStarted={handleGetStarted} />
        ) : (
          <Editor
            imageState={imageState}
            filters={filters}
            selectedFilter={selectedFilter}
            onFilterSelect={handleFilterSelect}
            onDownload={handleDownload}
            onImageUpload={handleImageUpload}
          />
        )}
      </main>
    </div>
  );
}

export default App;
