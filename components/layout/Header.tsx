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
    <header className="sticky top-0 z-30 h-16 bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            <Bars3Icon className="w-6 h-6 text-gray-300" />
          </button>
          
          {/* Page Title */}
          <h2 className="text-xl font-semibold text-gray-100">
            {getPageTitle()}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button 
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 relative"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5 text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          </button>
          
          {/* User Menu */}
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 ring-2 ring-gray-700",
                userButtonPopoverCard: "bg-gray-800 border border-gray-700",
                userButtonPopoverActionButton: "hover:bg-gray-700",
                userButtonPopoverActionButtonText: "text-gray-200",
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}