"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github, Chrome, Code } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
      {/* ── Ambient Gradient Background ── */}
      <div
        className="absolute inset-0 z-0 animate-ambient"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 20%, oklch(0.9 0 0 / 0.2) 0%, transparent 100%), " +
            "radial-gradient(ellipse 60% 50% at 70% 80%, oklch(0.85 0 0 / 0.12) 0%, transparent 100%)",
        }}
      />
      <div
        className="dark:block hidden absolute inset-0 z-0 animate-ambient"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 20%, oklch(0.3 0 0 / 0.2) 0%, transparent 100%), " +
            "radial-gradient(ellipse 60% 50% at 70% 80%, oklch(0.2 0 0 / 0.12) 0%, transparent 100%)",
        }}
      />

      {/* ── Dot Grid Texture ── */}
      <div className="absolute inset-0 z-[1] bg-grid opacity-60 dark:opacity-100" />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4 animate-fade-in-up">
        <div className="glass-card rounded-xl p-7 md:p-8">
          <div className="text-center space-y-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70 border border-neutral-300/50 dark:border-neutral-700/50">
              <Code className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                Sign in to DevSync
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Collaborate in real-time, directly in your browser
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                className="w-full gap-2 btn-glow h-10"
                onClick={() => signIn("github", { callbackUrl: "/" })}
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2 btn-glow h-10 border-neutral-300 dark:border-neutral-700 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                <Chrome className="h-4 w-4" />
                Continue with Google
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
            </div>

            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              By continuing, you agree to DevSync&rsquo;s Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}