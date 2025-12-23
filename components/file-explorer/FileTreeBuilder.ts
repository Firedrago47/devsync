import { FileNodeType } from '@/types/file';

export type FileTreeNode = FileNodeType & { children?: FileTreeNode[] };

export const buildTree = (files: FileNodeType[], parentId: string | null = null): FileTreeNode[] => {
  return files
    .filter((file) => file.parentId === parentId)
    .map((file) => ({
      ...file,
      children: file.type === 'folder' ? buildTree(files, file.id) : [],
    }));
};
