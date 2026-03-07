"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Loader2, Code, Lock, Users, Github, Chrome } from "lucide-react";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  /* ---------- Redirect authenticated users ---------- */
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || redirecting) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-600 dark:text-neutral-400 mb-2" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Initializing application
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2">
          <Code className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
          <h1 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
            DevSync
          </h1>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full mx-auto grid md:grid-cols-2 gap-8 items-center">
          {/* Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Build Together, Contribute Better
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              DevSync helps strengthen the FOSS community by teaching developers
              how to collaborate and contribute to open-source projects with
              confidence.
            </p>

            <div className="space-y-4">
              <Feature
                icon={<Users />}
                title="Learn by Collaborating"
                text="Pair with others in real time and learn contribution workflows hands-on."
              />
              <Feature
                icon={<Lock />}
                title="Open-Source Contribution Ready"
                text="Use a practical environment designed to help developers contribute faster and better."
              />
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-700">
                <Code className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
              </div>

              <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-200">
                Sign in to get started
              </h2>

              <Button
                onClick={() => signIn("github")}
                className="w-full gap-2"
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Button>

              <Button
                variant="outline"
                onClick={() => signIn("google")}
                className="w-full gap-2"
              >
                <Chrome className="h-4 w-4" />
                Continue with Google
              </Button>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-4">
                By signing in, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-4">
        <div className="container mx-auto px-4 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>© {new Date().getFullYear()} DevSync</span>
          <span>Secure OAuth authentication</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Small helper ---------- */

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
    <div className="flex items-start gap-3">
      <div className="bg-neutral-200 dark:bg-neutral-700 p-2 rounded-md">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
          {title}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {text}
        </p>
      </div>
    </div>
  );
}
