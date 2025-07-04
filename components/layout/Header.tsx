"use client";

import { UserButton } from "@clerk/nextjs";
import { BellIcon } from "@heroicons/react/24/outline";

export default function Header() {
  return (
    <header className="h-16 bg-background-primary border-b border-border-default flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        {/* Empty space for now - can add breadcrumbs or page title */}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button 
          className="p-2 rounded-lg hover:bg-background-hover transition-colors duration-200 relative"
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-light rounded-full" />
        </button>
        
        {/* User Menu */}
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              userButtonPopoverCard: "bg-background-card border border-border-default",
              userButtonPopoverActionButton: "hover:bg-background-hover",
              userButtonPopoverActionButtonText: "text-text-primary",
              userButtonPopoverFooter: "hidden",
            },
          }}
        />
      </div>
    </header>
  );
}