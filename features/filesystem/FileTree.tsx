// features/filesystem/FileTree.tsx
"use client";

import { Fragment, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
  MoreHorizontal,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getFileIcon } from "./file.icon";

import { useFSStore } from "@/features/collaboration/filesystem/fs.store";
import {
  createNode,
  renameNode,
  deleteNode,
} from "@/features/collaboration/filesystem/fs.action";

import { useEditorStore } from "@/features/collaboration/editor/editor.store";
import { getLanguageFromFilename } from "@/features/editor/language";
import type { FSNode } from "@/features/collaboration/filesystem/fs.types";

import { useRoomStore } from "@/features/rooms/room.store";
import { resolveMyRole } from "@/features/rooms/identity";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ---------------- Helpers ---------------- */

function buildTree(nodes: FSNode[]) {
  const map = new Map<string | null, FSNode[]>();

  for (const node of nodes) {
    const key = node.parentId ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(node);
  }

  for (const children of map.values()) {
    children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  return map;
}

/* ---------------- Component ---------------- */

export default function FileTree({ roomId }: { roomId: string }) {
  /* ---------- Store access ---------- */
  const room = useRoomStore((s) => s.room);
  const members = useRoomStore((s) => s.members);
  const nodesMap = useFSStore((s) => s.nodes);
  const openFile = useEditorStore((s) => s.openFile);
  const activeFileId = useEditorStore((s) => s.activeFileId);

  /* ---------- Derived state ---------- */
  const nodes = useMemo(() => Object.values(nodesMap), [nodesMap]);
  const tree = useMemo(() => buildTree(nodes), [nodes]);

  /* ---------- Local state ---------- */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<FSNode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  /* ---------- Permissions ---------- */
  const myRole = resolveMyRole(members, session?.user);
  const canEdit = myRole !== "viewer";

  /* ---------- Effects ---------- */
  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      const name = inputRef.current.value;
      const dotIndex = name.lastIndexOf(".");
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [renaming]);

  /* ---------- Handlers ---------- */
  const toggleFolder = useCallback((id: string) => {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  const handleOpenFile = useCallback(
    (node: FSNode) => {
      if (node.type !== "file") return;

      openFile({
        fileId: node.id,
        name: node.name,
        language: getLanguageFromFilename(node.name),
      });
    },
    [openFile]
  );

  const startRename = useCallback((nodeId: string) => {
    setRenaming(nodeId);
  }, []);

  const handleRename = useCallback(
    (nodeId: string, newName: string) => {
      if (!newName.trim() || !canEdit) {
        setRenaming(null);
        return;
      }

      renameNode({
        roomId,
        id: nodeId,
        name: newName.trim(),
      });

      setRenaming(null);
    },
    [roomId, canEdit]
  );

  const handleCreateFile = useCallback(
    (parentId: string | null) => {
      if (!canEdit) return;

      createNode({
        roomId,
        parentId,
        name: "new-file.ts",
        type: "file",
      });
    },
    [roomId, canEdit]
  );

  const handleCreateFolder = useCallback(
    (parentId: string | null) => {
      if (!canEdit) return;

      createNode({
        roomId,
        parentId,
        name: "new-folder",
        type: "folder",
      });
    },
    [roomId, canEdit]
  );

  const handleDelete = useCallback(
    (node: FSNode) => {
      if (!canEdit) return;
      setNodeToDelete(node);
      setDeleteDialogOpen(true);
    },
    [canEdit]
  );

  const confirmDelete = useCallback(() => {
    if (!nodeToDelete || !canEdit) return;

    deleteNode({
      roomId,
      id: nodeToDelete.id,
    });

    setDeleteDialogOpen(false);
    setNodeToDelete(null);
  }, [nodeToDelete, roomId, canEdit]);

  /* ---------- Render nodes ---------- */
  function renderNodes(parentId: string | null, depth = 0) {
    const children = tree.get(parentId);
    if (!children) return null;

    return children.map((node) => {
      const isFolder = node.type !== "file";
      const isOpen = expanded[node.id];
      const isActive = node.id === activeFileId;
      const isRenaming = renaming === node.id;
      const isHovered = hoveredNode === node.id;

      const Icon = isFolder
        ? isOpen
          ? FolderOpen
          : Folder
        : getFileIcon(node.name);

      return (
        <Fragment key={node.id}>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                className={cn(
                  "group relative flex items-center gap-1.5 py-0.5 text-[13px] select-none cursor-pointer",
                  "transition-all duration-75",
                  isActive && !isRenaming
                    ? "bg-neutral-200 dark:bg-neutral-700/60 text-neutral-900 dark:text-white border-l-2 border-neutral-500 dark:border-neutral-400"
                    : isHovered
                    ? "bg-neutral-200 dark:bg-white/5"
                    : "hover:bg-neutral-100 dark:hover:bg-white/[0.03]",
                  isFolder && "font-medium"
                )}
                style={{
                  paddingLeft: depth === 0 ? 8 : 8 + depth * 16,
                  paddingRight: 8,
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (isRenaming) return;
                  if (isFolder) {
                    toggleFolder(node.id);
                  } else {
                    handleOpenFile(node);
                  }
                }}
              >
                {/* Chevron */}
                {isFolder ? (
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    {isOpen ? (
                      <ChevronDown size={14} className="text-neutral-500" />
                    ) : (
                      <ChevronRight size={14} className="text-neutral-500" />
                    )}
                  </div>
                ) : (
                  <span className="w-4" />
                )}

                {/* Icon */}
                <Icon
                  size={16}
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    isFolder
                      ? isOpen
                        ? "text-neutral-500"
                        : "text-neutral-600"
                      : "text-neutral-500"
                  )}
                />

                {/* Name or Rename Input */}
                {isRenaming ? (
                  <input
                    ref={inputRef}
                    type="text"
                    defaultValue={node.name}
                    className="flex-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-600 rounded px-1.5 py-0.5 text-neutral-900 dark:text-white outline-none shadow-lg"
                    onBlur={(e) => handleRename(node.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRename(node.id, e.currentTarget.value);
                      } else if (e.key === "Escape") {
                        setRenaming(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={cn(
                      "flex-1 truncate",
                      isActive
                        ? "text-neutral-900 dark:text-white font-medium"
                        : "text-neutral-700 dark:text-neutral-300"
                    )}
                  >
                    {node.name}
                  </span>
                )}

                {/* Hover Actions */}
                {!isRenaming && canEdit && (isHovered || isActive) && (
                  <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={12} className="text-neutral-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {isFolder && (
                          <>
                            <DropdownMenuItem onClick={() => handleCreateFile(node.id)}>
                              <FilePlus size={14} className="mr-2" />
                              New File
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateFolder(node.id)}>
                              <FolderPlus size={14} className="mr-2" />
                              New Folder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={() => startRename(node.id)}>
                          <Pencil size={14} className="mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(node)}
                          className="text-neutral-700 dark:text-neutral-300 focus:text-neutral-900 dark:focus:text-white"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </ContextMenuTrigger>

            {/* Context Menu */}
            <ContextMenuContent className="w-56">
              {isFolder && canEdit && (
                <>
                  <ContextMenuItem onClick={() => handleCreateFile(node.id)}>
                    <FilePlus size={14} className="mr-2" />
                    New File
                    <ContextMenuShortcut>Ctrl+N</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleCreateFolder(node.id)}>
                    <FolderPlus size={14} className="mr-2" />
                    New Folder
                    <ContextMenuShortcut>Ctrl+Shift+N</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}

              {canEdit && (
                <>
                  <ContextMenuItem onClick={() => startRename(node.id)}>
                    <Pencil size={14} className="mr-2" />
                    Rename
                    <ContextMenuShortcut>F2</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handleDelete(node)}>
                    <Trash2 size={14} className="mr-2 text-red-400" />
                    <span className="text-red-400">Delete</span>
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                  </ContextMenuItem>
                </>
              )}

              {!canEdit && (
                <ContextMenuItem disabled>
                  <span className="text-neutral-500">Read-only mode</span>
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>

          {/* Recursively render children */}
          {isFolder && isOpen && renderNodes(node.id, depth + 1)}
        </Fragment>
      );
    });
  }

  /* ---------- Loading state ---------- */
  if (!room) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  /* ---------- Empty state ---------- */
  if (!nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
          <FileText size={24} className="text-neutral-600" />
        </div>
        <p className="text-sm font-medium text-neutral-400 mb-1">No files yet</p>
        <p className="text-xs text-neutral-600">
          Use the top explorer icons to create files and folders.
        </p>
      </div>
    );
  }

  /* ---------- Main render ---------- */
  return (
    <>
      <div className="py-1">
        {renderNodes(null)}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {nodeToDelete?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{nodeToDelete?.name}</strong>?
              {nodeToDelete?.type === "folder" && (
                <span className="block mt-2 text-yellow-600">
                  This will also delete all files and folders inside it.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
