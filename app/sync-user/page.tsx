"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function SyncUserPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Call the sync endpoint
      fetch("/sync-user")
        .then((res) => {
          if (res.ok) {
            // Redirect to dashboard after successful sync
            router.push("/dashboard");
          } else {
            throw new Error("Sync failed");
          }
        })
        .catch((error) => {
          console.error("Failed to sync user:", error);
          // Still redirect to dashboard
          router.push("/dashboard");
        });
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-light border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Setting up your account...</p>
      </div>
    </div>
  );
}