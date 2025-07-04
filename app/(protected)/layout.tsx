"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider, useSidebar } from "@/lib/contexts/sidebar-context";

function ProtectedLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded } = useSidebar();
  
  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />
      <div 
        className="transition-all duration-300 ease-in-out" 
        style={{ marginLeft: isExpanded ? '256px' : '64px' }}
      >
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, userId } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setIsReady(true);
    }
  }, [isLoaded]);

  // Show loading spinner while Clerk is determining auth status
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-light border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // This shouldn't happen due to middleware, but just in case
  if (!userId) {
    return null;
  }

  return (
    <SidebarProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </SidebarProvider>
  );
}