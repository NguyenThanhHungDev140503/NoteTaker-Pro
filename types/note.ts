export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
  audioRecordings: string[];
  videos: string[];
  isFavorite: boolean;
  tags: string[];
}

export interface NoteFilter {
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  showFavoritesOnly: boolean;
}