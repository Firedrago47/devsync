"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Loader2, Code, Lock, Users, Github, Chrome, Sparkles } from "lucide-react";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || redirecting) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-muted animate-pulse-subtle blur-xl" />
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground relative z-10" />
        </div>
        <p className="text-sm text-muted-foreground mt-4 animate-pulse-subtle">
          Initializing application
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* ── Ambient Gradient Background ── */}
      <div
        className="absolute inset-0 z-0 animate-ambient"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, oklch(0.45 0.14 270 / 0.08) 0%, transparent 100%), " +
            "radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.38 0.14 270 / 0.04) 0%, transparent 100%)",
        }}
      />
      <div
        className="dark:block hidden absolute inset-0 z-0 animate-ambient"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, oklch(0.55 0.16 270 / 0.12) 0%, transparent 100%), " +
            "radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.4 0.14 270 / 0.06) 0%, transparent 100%)",
        }}
      />

      {/* ── Dot Grid Texture ── */}
      <div className="absolute inset-0 z-[1] bg-grid opacity-60 dark:opacity-100" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header (60% neutral background) */}
        <header className="bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              {/* 10% accent icon */}
              <div className="p-1.5 rounded-md bg-primary/10">
                <Code className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                DevSync
              </span>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="max-w-5xl w-full mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* ── Info / Hero ── (60% neutral text) */}
            <div className="space-y-6 animate-fade-in-up stagger-1">
              {/* 10% accent badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3 w-3" />
                Open-source collaboration platform
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight gradient-text leading-tight">
                Build Together,
                <br />
                Contribute Better
              </h2>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md">
                DevSync helps strengthen the FOSS community by teaching
                developers how to collaborate and contribute to open-source
                projects with confidence.
              </p>

              <div className="space-y-4 pt-2">
                <Feature
                  icon={<Users className="h-4 w-4" />}
                  title="Learn by Collaborating"
                  text="Pair with others in real time and learn contribution workflows hands-on."
                />
                <Feature
                  icon={<Lock className="h-4 w-4" />}
                  title="Open-Source Contribution Ready"
                  text="A practical environment designed to help developers contribute faster and better."
                />
              </div>
            </div>

            {/* ── Auth Card ── (30% secondary surface) */}
            <div className="animate-fade-in-up stagger-3">
              <div className="glass-card rounded-xl p-7 md:p-8">
                <div className="text-center space-y-5">
                  {/* 10% accent icon container */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
                    <Code className="h-6 w-6 text-primary" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground">
                      Sign in to get started
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Collaborate in real-time, directly in your browser
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Primary button gets accent (10%) */}
                    <Button
                      onClick={() => signIn("github")}
                      className="w-full gap-2 btn-glow h-10"
                    >
                      <Github className="h-4 w-4" />
                      Continue with GitHub
                    </Button>

                    {/* Outline button with secondary border (30%) */}
                    <Button
                      variant="outline"
                      onClick={() => signIn("google")}
                      className="w-full gap-2 btn-glow h-10"
                    >
                      <Chrome className="h-4 w-4" />
                      Continue with Google
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground/60 pt-2">
                    By signing in, you agree to our Terms and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-background/80 backdrop-blur-md border-t border-border py-4">
          <div className="container mx-auto px-4 flex justify-between text-xs text-muted-foreground/60">
            <span>© {new Date().getFullYear()} DevSync</span>
            <span>Secure OAuth authentication</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ---------- Feature list item ---------- */

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3.5 group">
      {/* 10% accent icon */}
      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:border-primary/40">
        {icon}
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}