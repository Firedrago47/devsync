export type FileNodeType = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNodeType[];
  parentId?: string | null;
};

export type TabType = {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
};