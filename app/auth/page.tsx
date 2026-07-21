"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github, Chrome, Code } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* ── Ambient Gradient Background ── (10% accent glow) */}
      <div
        className="absolute inset-0 z-0 animate-ambient"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 20%, oklch(0.45 0.14 270 / 0.08) 0%, transparent 100%), " +
            "radial-gradient(ellipse 60% 50% at 70% 80%, oklch(0.38 0.14 270 / 0.04) 0%, transparent 100%)",
        }}
      />
      <div
        className="dark:block hidden absolute inset-0 z-0 animate-ambient"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 20%, oklch(0.55 0.16 270 / 0.1) 0%, transparent 100%), " +
            "radial-gradient(ellipse 60% 50% at 70% 80%, oklch(0.4 0.14 270 / 0.05) 0%, transparent 100%)",
        }}
      />

      {/* ── Dot Grid Texture ── */}
      <div className="absolute inset-0 z-[1] bg-grid opacity-60 dark:opacity-100" />

      {/* ── Card ── (30% secondary surface via glass-card) */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4 animate-fade-in-up">
        <div className="glass-card rounded-xl p-7 md:p-8">
          <div className="text-center space-y-5">
            {/* 10% accent icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
              <Code className="h-6 w-6 text-primary" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground">
                Sign in to DevSync
              </h1>
              <p className="text-sm text-muted-foreground">
                Collaborate in real-time, directly in your browser
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* 10% accent primary button */}
              <Button
                className="w-full gap-2 btn-glow h-10"
                onClick={() => signIn("github", { callbackUrl: "/" })}
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Button>

              {/* Outline button inherits secondary border (30%) */}
              <Button
                variant="outline"
                className="w-full gap-2 btn-glow h-10"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                <Chrome className="h-4 w-4" />
                Continue with Google
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60">
              By continuing, you agree to DevSync&rsquo;s Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}