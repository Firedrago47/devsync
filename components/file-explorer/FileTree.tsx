'use client';

import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Folder,
  FileText,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { FileNodeType } from '@/types/file';
import { getFilesFromStorage, saveFilesToStorage, getFileContent } from '@/utils/fileStorage';
import { getLanguageFromExtension } from '@/utils/languageUtils';
import { useTabStore } from '@/state/tabState';

const FileTree: React.FC = () => {
  const [tree, setTree] = useState<FileNodeType[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeParents, setActiveParents] = useState<Set<string>>(new Set());
  const { addTab } = useTabStore();

  useEffect(() => {
    setTree(getFilesFromStorage());
  }, []);

    // calculate parent folders of active node
    useEffect(() => {
      if (!activeNode) return;

      const parents = new Set<string>();
      let current: FileNodeType | undefined = tree.find(n => n.id === activeNode);

      while (current?.parentId) {
        parents.add(current.parentId);

        // safe find, optional chaining ensures no error
        current = tree.find(n => n.id === current?.parentId);
      }

      setActiveParents(parents);
    }, [activeNode, tree]);

  const updateTree = (updated: FileNodeType[]) => {
    setTree(updated);
    saveFilesToStorage(updated);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expanded);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpanded(newSet);
    setActiveNode(id);
  };

  const createNode = (type: 'file' | 'folder', parentId?: string) => {
    const name = prompt(`Enter ${type} name`);
    if (!name) return;

    const newNode: FileNodeType = {
      id: uuidv4(),
      name,
      type,
      parentId,
    };

    const updatedTree = [...tree, newNode];
    updateTree(updatedTree);

    if (type === 'file') {
      addTab({
        id: newNode.id,
        name: newNode.name,
        path: newNode.id,
        content: '',
        language: getLanguageFromExtension(newNode.name),
      });
      setActiveNode(newNode.id);
    }
  };

  const renameNode = (id: string) => {
    const name = prompt('Enter new name');
    if (!name) return;
    updateTree(tree.map(n => (n.id === id ? { ...n, name } : n)));
  };

  const deleteNode = (id: string) => {
    if (!confirm('Delete this item and its children?')) return;

    const removeRecursive = (id: string): string[] => {
      const children = tree.filter(n => n.parentId === id);
      return [id, ...children.flatMap(c => removeRecursive(c.id))];
    };

    const toDelete = removeRecursive(id);
    updateTree(tree.filter(n => !toDelete.includes(n.id)));

    if (activeNode && toDelete.includes(activeNode)) setActiveNode(null);
  };

  const openFile = (node: FileNodeType) => {
    if (node.type !== 'file') return;
    addTab({
      id: node.id,
      name: node.name,
      path: node.id,
      content: getFileContent(node.id),
      language: getLanguageFromExtension(node.name),
    });
    setActiveNode(node.id);
  };

  const renderNodes = (parentId?: string) => {
    const children = tree.filter(n => n.parentId === parentId);

    return (
      <ul className="ml-2">
        {children.map(node => {
          const isFolder = node.type === 'folder';
          const isOpen = expanded.has(node.id);
          const isActive = activeNode === node.id;
          const isParentActive = activeParents.has(node.id);

          return (
            <li key={node.id} className="group">
              <div
                className={`flex items-center justify-between px-1 py-1 rounded cursor-pointer
                  ${
                    isActive
                      ? 'bg-zinc-600 border-l-2 border-blue-500'
                      : isParentActive
                      ? 'bg-zinc-700' // subtle highlight for parent folders
                      : 'hover:bg-zinc-900'
                  }
                `}
              >
                <div
                  className="flex items-center gap-1 select-none"
                  onClick={() => (isFolder ? toggleExpand(node.id) : openFile(node))}
                >
                  {isFolder ? (
                    isOpen ? (
                      <ChevronDown size={14} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400" />
                    )
                  ) : (
                    <FileText size={14} className="text-gray-400" />
                  )}
                  {isFolder && <Folder size={14} className="text-yellow-400" />}
                  <span className="text-sm truncate max-w-[140px]">{node.name}</span>
                </div>

                <div className="hidden group-hover:flex gap-1">
                  <Pencil size={13} className="cursor-pointer" onClick={() => renameNode(node.id)} />
                  <Trash2 size={13} className="cursor-pointer" onClick={() => deleteNode(node.id)} />
                  {isFolder && (
                    <>
                      <Plus size={13} className="cursor-pointer" onClick={() => createNode('file', node.id)} />
                      <Folder size={13} className="cursor-pointer" onClick={() => createNode('folder', node.id)} />
                    </>
                  )}
                </div>
              </div>

              {isFolder && isOpen && renderNodes(node.id)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="h-full text-sm">
      <div className="flex justify-between items-center px-2 py-1 mb-2 border rounded border-[#333]">
        <span className="font-semibold text-gray-300">Project</span>
        <div className="flex gap-2">
          <Plus size={16} className="cursor-pointer hover:text-green-300" onClick={() => createNode('file')} />
          <Folder size={16} className="cursor-pointer hover:text-yellow-300" onClick={() => createNode('folder')} />
        </div>
      </div>
      <div className="px-1 overflow-y-auto h-full">{renderNodes()}</div>
    </div>
  );
};

export default FileTree;