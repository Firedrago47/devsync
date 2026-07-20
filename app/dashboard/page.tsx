"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { createRoom } from "@/features/rooms/room.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Sparkles,
  User,
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
        const url = new URL("/api/rooms", backendUrl);

        const headers: Record<string, string> = {};
        if (session?.authToken) {
          headers.Authorization = `Bearer ${session.authToken}`;
        } else if (session?.idToken) {
          headers.Authorization = `Bearer ${session.idToken}`;
        } else if (session?.accessToken) {
          headers.Authorization = `Bearer ${session.accessToken}`;
        }

        const res = await fetch(url.toString(), {
          credentials: "include",
          headers,
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
      <div className="h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse-subtle blur-xl" />
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500 dark:text-neutral-400 relative z-10" />
        </div>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-4 animate-pulse-subtle">
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
      {/* ── Ambient Gradient Background ── */}
      <div
        className="absolute inset-0 z-0 animate-ambient"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, oklch(0.9 0 0 / 0.2) 0%, transparent 100%), " +
            "radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.85 0 0 / 0.1) 0%, transparent 100%)",
        }}
      />
      <div
        className="dark:block hidden absolute inset-0 z-0 animate-ambient"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, oklch(0.3 0 0 / 0.2) 0%, transparent 100%), " +
            "radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.2 0 0 / 0.1) 0%, transparent 100%)",
        }}
      />

      {/* ── Dot Grid Texture ── */}
      <div className="absolute inset-0 z-[1] bg-grid opacity-60 dark:opacity-100" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass glass-border">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-neutral-200 dark:bg-neutral-800">
                <LayoutDashboard className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
                Workspace
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-200/50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400">
                <User className="h-3 w-3" />
                {session.user?.email}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/auth" })}
                className="text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>

              <Toggle
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="border border-neutral-200 dark:border-neutral-800 data-[state=on]:bg-neutral-200 dark:data-[state=on]:bg-neutral-800"
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
        <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            {/* ── Project Controls ── */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                    Project Rooms
                  </h2>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5 ml-6">
                  Create or join a collaborative workspace
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Create */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Create Room
                    </h5>
                    <div className="focus-ring rounded-lg">
                      <Input
                        placeholder="Project name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <Button
                      onClick={handleCreateRoom}
                      disabled={!projectName.trim()}
                      className="w-full h-9 btn-glow"
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-1.5 h-4 w-4" />
                      )}
                      Create Project Room
                    </Button>
                  </div>

                  {/* Join */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Join Room
                    </h5>
                    <div className="focus-ring rounded-lg">
                      <Input
                        placeholder="Room ID"
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        className="border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <Button
                      onClick={handleJoinRoom}
                      disabled={!roomIdInput.trim()}
                      className="w-full h-9 btn-glow"
                    >
                      {isJoining ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRightCircle className="mr-1.5 h-4 w-4" />
                      )}
                      Join
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer bar */}
              <div className="px-5 py-3 border-t border-neutral-200/60 dark:border-neutral-800/60 text-xs text-neutral-400 dark:text-neutral-500 flex justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
                <span>Signed in as {session.user?.name}</span>
                <span>Secure OAuth authentication</span>
              </div>
            </div>

            {/* ── Your Rooms ── */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-5 md:p-6">
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Your Rooms
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
                  Quickly rejoin existing rooms you created or already joined
                </p>

                {roomsLoading && (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-3 skeleton-shimmer"
                      >
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-4 w-40 bg-neutral-200 dark:bg-neutral-800" />
                          <Skeleton className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-md bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                    ))}
                  </div>
                )}

                {!roomsLoading && roomsError && (
                  <div className="text-sm text-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30 rounded-lg px-4 py-3 border border-red-200/50 dark:border-red-900/50">
                    {roomsError}
                  </div>
                )}

                {!roomsLoading && !roomsError && rooms.length === 0 && (
                  <div className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-3">
                      <DoorOpen className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <p>No rooms found yet.</p>
                    <p className="text-xs mt-1">
                      Create a room above to get started.
                    </p>
                  </div>
                )}

                {!roomsLoading && !roomsError && rooms.length > 0 && (
                  <div className="space-y-2">
                    {rooms.map((room, idx) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-3 transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm hover:-translate-y-0.5 bg-white/30 dark:bg-neutral-900/30"
                        style={{
                          animationDelay: `${idx * 0.05}s`,
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                            {room.name}
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                            <span className="font-mono">{room.id.slice(0, 8)}...</span>
                            {" • "}
                            <span className="uppercase text-[10px] tracking-wider font-medium text-neutral-500 dark:text-neutral-400">
                              {room.role}
                            </span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/room/${room.id}`)}
                          className="h-8 btn-glow shrink-0"
                        >
                          <DoorOpen className="mr-1.5 h-3.5 w-3.5" />
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
    </div>
  );
}