"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { createRoom } from "@/features/rooms/room.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { useTheme } from "next-themes";

import {
  LogOut,
  Plus,
  ArrowRightCircle,
  Loader2,
  LayoutDashboard,
  Sun,
  Moon,
  DoorOpen,
} from "lucide-react";

type DashboardRoom = {
  id: string;
  name: string;
  ownerId: string;
  role: "owner" | "editor" | "viewer";
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [roomIdInput, setRoomIdInput] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [rooms, setRooms] = useState<DashboardRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  /* ---------- Auth Guard ---------- */

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    let cancelled = false;
    const controller = new AbortController();

    async function loadRooms() {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL ?? window.location.origin;
        const userId = session?.user?.id;
        if (!userId) return;

        const url = new URL("/api/rooms", backendUrl);
        url.searchParams.set("userId", userId);

        const res = await fetch(url.toString(), {
          signal: controller.signal,
        });

        const data = (await res.json().catch(() => ({}))) as {
          rooms?: DashboardRoom[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load rooms");
        }

        if (cancelled) return;

        const list = Array.isArray(data.rooms) ? data.rooms : [];
        setRooms(list);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load rooms";
        setRoomsError(message);
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    }

    void loadRooms();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [session?.user?.id]);

  if (status === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-600 dark:text-neutral-400 mb-2" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Loading dashboard
        </p>
      </div>
    );
  }

  if (!session) return null;

  /* ---------- Actions ---------- */

  async function handleCreateRoom() {
    if (!projectName.trim() || !session?.user?.id) return;
    setIsCreating(true);

    try {
      const roomId = await createRoom(projectName, session.user.id);

      router.push(`/room/${roomId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown room creation error";
      console.error("Room creation failed:", message, err);
    } finally {
      setIsCreating(false);
    }
  }

  function handleJoinRoom() {
    setIsJoining(true);
    if (roomIdInput.trim()) {
      router.push(`/room/${roomIdInput.trim()}`);
    }
  }

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
            <h1 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
              Workspace
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {session.user?.email}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/auth" })}
              className="text-neutral-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>

            <Toggle
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Toggle>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Project Controls */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <div className="p-5">
              <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Project Rooms
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Create or join a collaborative workspace
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create */}
                <div className="space-y-4">
                  <h5 className="text-md font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Create Room:
                  </h5>
                  <Input
                    placeholder="Project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />

                  <Button
                    onClick={handleCreateRoom}
                    disabled={!projectName.trim()}
                    className="w-full h-9"
                  >
                    {isCreating ? (
                      <Loader2 className="h-6 w-6 animate-spin text-neutral-300 dark:text-neutral-600" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create Project Room
                  </Button>
                </div>

                {/* Join */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Join Room:
                  </h4>
                  <Input
                    placeholder="Room ID"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!roomIdInput.trim()}
                    className="w-full h-9"
                  >
                    {isJoining ? (
                      <Loader2 className="h-6 w-6 animate-spin text-neutral-300 dark:text-neutral-600" />
                    ) : (
                      <ArrowRightCircle className="mr-2 h-4 w-4" />
                    )}
                    Join
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="px-5 py-3 text-xs text-neutral-500 dark:text-neutral-400 flex justify-between">
              <span>Signed in as {session.user?.name}</span>
              <span>Secure OAuth authentication</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <div className="p-5">
              <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Your Rooms
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Quickly rejoin existing rooms you created or already joined
              </p>

              {roomsLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              )}

              {!roomsLoading && roomsError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {roomsError}
                </div>
              )}

              {!roomsLoading && !roomsError && rooms.length === 0 && (
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  No rooms found yet.
                </div>
              )}

              {!roomsLoading && !roomsError && rooms.length > 0 && (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {room.name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {room.id} • {room.role.toUpperCase()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/room/${room.id}`)}
                        className="h-8"
                      >
                        <DoorOpen className="mr-2 h-4 w-4" />
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
