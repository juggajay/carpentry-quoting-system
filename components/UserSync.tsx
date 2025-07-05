"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function UserSync({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && !isSynced) {
      fetch("/api/sync-user")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to sync user");
          return res.json();
        })
        .then(() => setIsSynced(true))
        .catch((err) => {
          console.error("User sync failed:", err);
          setError(err.message);
          // Still allow access even if sync fails
          setIsSynced(true);
        });
    }
  }, [isLoaded, isSignedIn, isSynced]);

  if (!isLoaded || (isSignedIn && !isSynced)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-background-hover rounded mb-4"></div>
          <div className="h-4 w-48 bg-background-hover rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn("User sync error (non-blocking):", error);
  }

  return <>{children}</>;
}