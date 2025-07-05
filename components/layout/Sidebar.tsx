"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { navigationLinks } from "@/lib/constants";
import { useSidebar } from "@/lib/contexts/sidebar-context";

export default function Sidebar() {
  const { isExpanded, setIsExpanded } = useSidebar();
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ width: isExpanded ? 256 : 80 }}
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-screen flex flex-col bg-[#121214] border-r border-[#2A2A2E]"
    >
      {/* Logo / Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#2A2A2E]">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.h1
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-h3 text-[#FAFAFA]"
            >
              CarpentryQS
            </motion.h1>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 bg-[#22C55E] rounded-lg flex items-center justify-center"
            >
              <span className="text-[#0A0A0B] font-bold text-lg">C</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive 
                      ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20" 
                      : "text-[#A1A1AA] hover:bg-white/5 hover:text-[#FAFAFA]"
                    }
                  `}
                >
                  <Icon className={`
                    w-6 h-6 flex-shrink-0 transition-colors duration-200
                    ${isActive ? "text-[#22C55E]" : "text-[#71717A] group-hover:text-[#FAFAFA]"}
                  `} />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="ml-3 truncate font-medium"
                      >
                        {link.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle Button */}
      <div className="p-3 border-t border-[#2A2A2E]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center p-2.5 rounded-lg bg-[#1A1A1D] hover:bg-white/5 transition-colors duration-200 border border-[#2A2A2E] hover:border-[#3A3A3F]"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeftIcon className="w-5 h-5 text-[#A1A1AA]" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-[#A1A1AA]" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}