import { FileNodeType } from '@/types/file';

const STORAGE_KEY = 'file_tree';
// Assuming your localStorage key is 'devsync-files'

export function getFileContent(path: string): string {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return '';

  const files = JSON.parse(raw);
  const file = files.find((f: any) => f.path === path);
  return file?.content || '';
}

export function saveFileContent(path: string, content: string) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  const files = JSON.parse(raw);
  const index = files.findIndex((f: any) => f.path === path);
  if (index !== -1) {
    files[index].content = content;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }
}


export const loadFileTree = (): FileNodeType[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveFileTree = (tree: FileNodeType[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
};

export const getFilesFromStorage = (): FileNodeType[] => {
  const data = localStorage.getItem('files');
  return data ? JSON.parse(data) : [];
};

export const saveFilesToStorage = (files: FileNodeType[]) => {
  localStorage.setItem('files', JSON.stringify(files));
};

export const addNode = (parentId: string | null, node: FileNodeType) => {
  const tree = loadFileTree();
  
  const insert = (nodes: FileNodeType[]): FileNodeType[] => {
    return nodes.map(n => {
      if (n.id === parentId) {
        if (!n.children) n.children = [];
        n.children.push(node);
      } else if (n.children) {
        n.children = insert(n.children);
      }
      return n;
    });
  };

  const updatedTree = parentId ? insert(tree) : [...tree, node];
  saveFileTree(updatedTree);
  return updatedTree;
};

export const renameNode = (nodeId: string, newName: string) => {
  const update = (nodes: FileNodeType[]): FileNodeType[] =>
    nodes.map(n => {
      if (n.id === nodeId) n.name = newName;
      if (n.children) n.children = update(n.children);
      return n;
    });

  const tree = update(loadFileTree());
  saveFileTree(tree);
  return tree;
};

export const deleteNode = (nodeId: string) => {
  const remove = (nodes: FileNodeType[]): FileNodeType[] =>
    nodes
      .filter(n => n.id !== nodeId)
      .map(n => {
        if (n.children) n.children = remove(n.children);
        return n;
      });

  const tree = remove(loadFileTree());
  saveFileTree(tree);
  return tree;
};