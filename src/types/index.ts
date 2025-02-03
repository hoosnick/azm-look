export interface Filter {
  id: string;
  image: string;
}

export interface ImageState {
  original: string | null;
  processed: string | null;
  loading: boolean;
  error: string | null;
  resourceId: string | null;
}