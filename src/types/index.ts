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

export interface ApiFilter {
  id: string;
  image_url: string;
}
