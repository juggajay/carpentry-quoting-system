"use client";

import { UserButton } from "@clerk/nextjs";
import { BellIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  
  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/quotes")) return "Quotes";
    if (pathname.startsWith("/import")) return "Import";
    if (pathname.startsWith("/search")) return "Search";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 border-b border-border backdrop-blur-lg">
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-background-tertiary transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            <Bars3Icon className="w-6 h-6 text-muted-foreground" />
          </button>
          
          {/* Page Title */}
          <h2 className="text-xl font-semibold text-foreground">
            {getPageTitle()}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button 
            className="p-2 rounded-lg hover:bg-background-tertiary transition-colors duration-200 relative"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </button>
          
          {/* User Menu */}
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 ring-2 ring-border hover:ring-border transition-all duration-200",
                userButtonPopoverCard: "bg-background-tertiary border border-border shadow-xl",
                userButtonPopoverActionButton: "hover:bg-white/5 transition-colors duration-200",
                userButtonPopoverActionButtonText: "text-foreground",
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}