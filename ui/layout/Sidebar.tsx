// ui/layout/Sidebar.tsx
"use client";

import type { SidebarView } from "./layout.types";
import { useSession } from "next-auth/react";
import FileTree from "@/features/filesystem/FileTree";
import { usePresenceStore } from "@/features/collaboration/presence/presence.store";
import { createNode } from "@/features/collaboration/filesystem/fs.action";
import { getSocket } from "@/features/collaboration/client/socket";
import { assignRoomMemberRole } from "@/features/rooms/room.actions";
import { useRoomStore } from "@/features/rooms/room.store";
import { resolveMyRole } from "@/features/rooms/identity";

import {
  FilePlus,
  FolderPlus,
  RefreshCcw,
  MoreVertical,
  ChevronRight,
  FolderClosed,
  Users,
  GitBranch,
  Play,
} from "lucide-react";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  roomId: string;
  view: SidebarView;
  projectName?: string;
}

export default function Sidebar({ roomId, view, projectName = "Project" }: SidebarProps) {
  const usersMap = usePresenceStore((s) => s.users);
  const members = useRoomStore((s) => s.members);
  const joinRequests = useRoomStore((s) => s.joinRequests);
  const { data: session } = useSession();
  const users = useMemo(() => {
    const merged = new Map<string, (typeof usersMap)[string]>();

    for (const member of members) {
      merged.set(member.userId, {
        userId: member.userId,
        name: member.userId.slice(0, 8),
        color: "#6b7280",
        cursor: null,
        online: false,
        lastSeen: 0,
      });
    }

    for (const user of Object.values(usersMap)) {
      merged.set(user.userId, user);
    }

    return [...merged.values()];
  }, [members, usersMap]);
  const onlineUsers = users.filter((u) => u.online);
  const myRole = resolveMyRole(members, session?.user);
  const canEdit = myRole !== "viewer";
  const isOwner = myRole === "owner";
  const myUserId = session?.user?.id ?? "";

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCreateFile = () => {
    if (!canEdit) return;
    const name = prompt("File name:", "new-file.ts");
    if (!name?.trim()) return;

    createNode({
      roomId,
      parentId: null,
      name: name.trim(),
      type: "file",
    });
  };

  const handleCreateFolder = () => {
    if (!canEdit) return;
    const name = prompt("Folder name:", "new-folder");
    if (!name?.trim()) return;

    createNode({
      roomId,
      parentId: null,
      name: name.trim(),
      type: "folder",
    });
  };

  const handleAssignRole = (userId: string, role: "editor" | "viewer") => {
    const request = joinRequests.find((item) => item.userId === userId);
    assignRoomMemberRole({
      roomId,
      userId,
      role,
    });
    toast(`Assigned ${role} role to ${request?.name ?? userId}`);
  };

  const getMemberRole = (userId: string) =>
    members.find((m) => m.userId === userId)?.role;

  const handleCloneRepository = () => {
    if (!canEdit) return;
    const repoUrl = prompt("Git repository URL:", "https://github.com/user/repo.git");
    if (!repoUrl?.trim()) return;

    const socket = getSocket();
    socket.emit(
      "repo:clone",
      { roomId, repoUrl: repoUrl.trim() },
      (response?: { ok?: boolean; error?: string; importedFiles?: number }) => {
        if (!response?.ok) {
          toast.error(response?.error || "Failed to import repository");
          return;
        }
        toast.success(`Repository imported (${response.importedFiles ?? 0} files)`);
      }
    );
  };

  return (
    <div className="h-full flex flex-col bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-300 dark:border-neutral-800">
      {/* ---------- Header ---------- */}
      <div className="h-9 flex items-center justify-between px-2.5 border-b border-neutral-300 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/5 rounded transition-colors"
          >
            <ChevronRight
              size={14}
              className={cn(
                "text-neutral-500 transition-transform duration-200",
                !isCollapsed && "rotate-90"
              )}
            />
          </button>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 truncate">
            {view === "explorer" ? "Explorer" : 
             view === "collab" ? "Collaboration" :
             view === "git" ? "Source Control" :
             view === "run" ? "Run & Debug" :
             view === "settings" ? "Settings" : view}
          </span>
        </div>

        {view === "explorer" && !isCollapsed && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateFile}
              disabled={!canEdit}
              className="h-6 w-6 hover:bg-neutral-200 dark:hover:bg-white/10"
              title={canEdit ? "New File (Ctrl+N)" : "Read-only"}
            >
              <FilePlus size={14} className="text-neutral-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateFolder}
              disabled={!canEdit}
              className="h-6 w-6 hover:bg-neutral-200 dark:hover:bg-white/10"
              title={canEdit ? "New Folder (Ctrl+Shift+N)" : "Read-only"}
            >
              <FolderPlus size={14} className="text-neutral-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              className="h-6 w-6 hover:bg-neutral-200 dark:hover:bg-white/10"
              title="Refresh Explorer"
            >
              <RefreshCcw size={13} className="text-neutral-500" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-neutral-200 dark:hover:bg-white/10"
                >
                  <MoreVertical size={13} className="text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCreateFile}>
                  <FilePlus size={14} className="mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateFolder}>
                  <FolderPlus size={14} className="mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.reload()}>
                  <RefreshCcw size={14} className="mr-2" />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ---------- Content ---------- */}
      {!isCollapsed && (
        <>
          {/* ---------- Explorer View ---------- */}
          {view === "explorer" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Project Header */}
              <div className="px-2.5 py-1.5 bg-neutral-200 dark:bg-neutral-800/30">
                <div className="flex items-center gap-1.5 px-1">
                  <FolderClosed size={15} className="text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                    {projectName}
                  </span>
                </div>
              </div>

              <Separator className="bg-neutral-300 dark:bg-neutral-800" />

              {/* File Tree */}
              <ScrollArea className="flex-1">
                <FileTree roomId={roomId} />
              </ScrollArea>
            </div>
          )}

          {/* ---------- Git View ---------- */}
          {view === "git" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800/50 flex items-center justify-center mb-4">
                <GitBranch size={28} className="text-neutral-500 dark:text-neutral-600" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                No Repository
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-500 mb-4 max-w-[200px]">
                Initialize a git repository or clone an existing one to get started
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={!canEdit}
                onClick={handleCloneRepository}
              >
                <GitBranch size={12} className="mr-2" />
                Clone Repository
              </Button>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-600 mt-6">
                Paste a public Git URL to import files into this room
              </p>
            </div>
          )}

          {/* ---------- Run View ---------- */}
          {view === "run" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800/50 flex items-center justify-center mb-4">
                <Play size={28} className="text-neutral-500 dark:text-neutral-600" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                No Configurations
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-500 mb-4 max-w-[200px]">
                Create a launch configuration to run and debug your code
              </p>
              <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
                <Play size={12} className="mr-2" />
                Create Configuration
              </Button>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-600 mt-6">
                Coming soon...
              </p>
            </div>
          )}

          {/* ---------- Collaboration View ---------- */}
          {view === "collab" && (
            <div className="flex-1 flex flex-col min-h-0">
              {isOwner && joinRequests.length > 0 && (
                <div className="px-3 py-2 border-b border-neutral-300 dark:border-neutral-700 bg-neutral-200/60 dark:bg-neutral-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                      Join Requests
                    </span>
                    <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                      {joinRequests.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {joinRequests.map((request) => (
                      <div
                        key={request.userId}
                        className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-2 bg-neutral-100 dark:bg-neutral-900/60"
                      >
                        <p className="text-xs text-neutral-700 dark:text-neutral-200 truncate">{request.name}</p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-500 truncate">
                          {request.email ?? request.userId}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => handleAssignRole(request.userId, "editor")}
                          >
                            Assign Editor
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => handleAssignRole(request.userId, "viewer")}
                          >
                            Assign Viewer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Header Stats */}
              <div className="px-3 py-3 bg-neutral-200 dark:bg-neutral-800/30 border-b border-neutral-300 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-500 dark:bg-neutral-400" />
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-neutral-500 dark:bg-neutral-400 animate-ping" />
                    </div>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {onlineUsers.length} Online
                    </span>
                  </div>
                  <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                    {users.length} Total
                  </Badge>
                </div>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-500">
                  {users.length - onlineUsers.length} offline
                </p>
              </div>

              {/* User List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {onlineUsers.length > 0 && (
                    <>
                      <div className="px-2 py-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                          Active Now
                        </span>
                      </div>
                      {onlineUsers.map((u) => (
                        <div
                          key={u.userId}
                          className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-neutral-200 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                              style={{ backgroundColor: u.color }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neutral-500 dark:bg-neutral-400 border-2 border-neutral-100 dark:border-neutral-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-500 truncate">
                              {getMemberRole(u.userId) ? (
                                <span className="uppercase">{getMemberRole(u.userId)}</span>
                              ) : u.cursor?.fileId ? (
                                <span className="text-neutral-600 dark:text-neutral-300">Editing</span>
                              ) : (
                                "Online"
                              )}
                            </p>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <MoreVertical size={12} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                {isOwner &&
                                  u.userId !== myUserId &&
                                  getMemberRole(u.userId) !== "owner" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleAssignRole(u.userId, "editor")}
                                      >
                                        Assign Editor
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleAssignRole(u.userId, "viewer")}
                                      >
                                        Assign Viewer
                                      </DropdownMenuItem>
                                    </>
                                  )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {users.filter((u) => !u.online).length > 0 && (
                    <>
                      <div className="px-2 py-1 mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                          Offline
                        </span>
                      </div>
                      {users.filter((u) => !u.online).map((u) => (
                        <div
                          key={u.userId}
                          className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-neutral-200 dark:hover:bg-white/5 transition-colors opacity-50"
                        >
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: u.color }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neutral-500 dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-neutral-600 truncate">
                              {getMemberRole(u.userId)?.toUpperCase() ?? "OFFLINE"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {users.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                      <Users size={24} className="text-neutral-500 dark:text-neutral-700 mb-2" />
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">No users yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* ---------- Settings View ---------- */}
          {view === "settings" && (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Editor Settings */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-wider">
                    Editor
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-400">Font Size</label>
                      <select className="h-7 px-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                        <option>12px</option>
                        <option>14px</option>
                        <option>16px</option>
                        <option>18px</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-400">Tab Size</label>
                      <select className="h-7 px-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                        <option>2 spaces</option>
                        <option>4 spaces</option>
                        <option>8 spaces</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-400">Word Wrap</label>
                      <select className="h-7 px-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                        <option>On</option>
                        <option>Off</option>
                        <option>Bounded</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Separator className="bg-neutral-300 dark:bg-neutral-800" />

                {/* Appearance Settings */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-wider">
                    Appearance
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-400">Theme</label>
                      <select className="h-7 px-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                        <option>Dark</option>
                        <option>Light</option>
                        <option>Auto</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-400">Activity Bar</label>
                      <select className="h-7 px-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                        <option>Visible</option>
                        <option>Hidden</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Separator className="bg-neutral-300 dark:bg-neutral-800" />

                {/* Collaboration Settings */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-wider">
                    Collaboration
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-400">Show Cursors</label>
                      <select className="h-7 px-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                        <option>Always</option>
                        <option>Never</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-400">Auto Save</label>
                      <select className="h-7 px-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                        <option>On</option>
                        <option>Off</option>
                        <option>On Focus Change</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
}
