export interface Filter {
  id: string;
  image: string;
  category: string;
}

export interface ImageState {
  original: string | null;
  processed: string | null;
  loading: boolean;
  error: string | null;
  resourceId: string | null;
}
