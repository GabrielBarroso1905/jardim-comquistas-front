export interface Achievement {
  id: number;
  title: string;
  year: number;
  description: string | null;
  completed: boolean;
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  // optional visual type used by the frontend to map to icons (tree, pine, cloud...)
  type?: 'tree' | 'pine' | 'cloud' | 'flag' | 'flower' | 'sky';
}