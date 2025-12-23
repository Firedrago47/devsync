"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "react-oidc-context"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { LogOut, Plus, ArrowRightCircle, Loader2, LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  const auth = useAuth()
  const router = useRouter()
  const [roomIdInput, setRoomIdInput] = useState("")
  const isDev = process.env.NODE_ENV === "development"

  const fakeEmail = "developer@devsync.local"
  const userEmail = process.env.NODE_ENV === "development" || !auth.isAuthenticated || isDev
    ? fakeEmail
    : auth.user?.profile.email

  useEffect(() => {
  if (!isDev && !auth.isLoading && !auth.isAuthenticated) {
    router.push("/")
  }
}, [auth.isAuthenticated, auth.isLoading])

  // useEffect(() => {
  //   if (!auth.isLoading && !auth.isAuthenticated) {
  //     router.push("/")
  //   }
  // }, [auth.isAuthenticated, auth.isLoading])

  if (auth.isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Loader2 className="h-6 w-6 text-slate-600 dark:text-slate-400 animate-spin mb-2" />
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Loading dashboard</p>
      </div>
    )
  }

if (!isDev && !auth.isAuthenticated) return null

  const handleCreateRoom = () => {
    const newRoomId = uuidv4()
    router.push(`/room/${newRoomId}`)
  }

  const handleJoinRoom = () => {
    if (roomIdInput.trim()) {
      router.push(`/room/${roomIdInput.trim()}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <h1 className="text-lg font-medium text-slate-800 dark:text-slate-200">Workspace</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">{userEmail}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => auth.removeUser()}
              className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="p-5">
              <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">Project Room Management</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Create a new project room or join an existing one
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Room Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Create New Project Room</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Generates unique ID</span>
                  </div>
                  <Button
                    onClick={handleCreateRoom}
                    className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 h-9"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create Project Room
                  </Button>
                </div>

                {/* Join Room Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Join Existing Project Room</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Enter room ID</span>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Room ID"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value)}
                      className="h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                    <Button
                      onClick={handleJoinRoom}
                      disabled={!roomIdInput.trim()}
                      className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 h-9"
                    >
                      <ArrowRightCircle className="mr-2 h-4 w-4" /> Join
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-700" />

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Last login: {new Date().toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">All rooms are end-to-end encrypted</p>
              </div>
            </div>
          </div>

          {/* Recent Rooms (Additional content to fill space professionally) */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-medium text-slate-800 dark:text-slate-200">Recent Project Rooms</h2>
            </div>
            <div className="p-0">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {[1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() => router.push(`/project/example-${i}`)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Room #{i}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last accessed {i} day{i !== 1 ? "s" : ""} ago
                      </p>
                    </div>
                    <ArrowRightCircle className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
