import { useState, useCallback, useEffect } from "react";
import ImageUpload from "./components/ImageUpload";
import Editor from "./components/Editor";
import { Filter, ImageState } from "./types";
import { apiService } from "./services/api";

function App() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    processed: null,
    loading: false,
    error: null,
    resourceId: null,
  });

  useEffect(() => {
    apiService
      .getFilters()
      .then((apiFilters) => {
        const filters: Filter[] = apiFilters.map((filter) => ({
          id: filter.id,
          image: filter.image_url,
        }));
        setFilters(filters);
      })
      .catch((error) => {
        console.error("Failed to load filters:", error);
      });
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      // Show original image immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageState((prev: ImageState) => ({
          ...prev,
          original: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);

      const fileToBlob = async (file: File) =>
        new Blob([new Uint8Array(await file.arrayBuffer())], {
          type: file.type,
        });
      const blobFile = await fileToBlob(file);

      // Upload to API
      const resourceId = await apiService.uploadImage(file, blobFile);
      setImageState((prev) => ({
        ...prev,
        resourceId,
        processed: null,
        error: null,
      }));
    } catch (error) {
      console.error("Upload error:", error);
      setImageState((prev) => ({
        ...prev,
        error: "Failed to upload image",
      }));
    }
  }, []);

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
        console.error("Apply filter error:", error);
        setImageState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to process image",
        }));
      }
    },
    [imageState.resourceId]
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

  const handleReset = useCallback(() => {
    setImageState({
      original: null,
      processed: null,
      loading: false,
      error: null,
      resourceId: null,
    });
    setSelectedFilter(null);
    
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <main>
        {!imageState.original ? (
          <ImageUpload onImageUpload={handleImageUpload} />
        ) : (
          <Editor
            imageState={imageState}
            filters={filters}
            selectedFilter={selectedFilter}
            onFilterSelect={handleFilterSelect}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
