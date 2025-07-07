"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { navigationLinks } from "@/lib/constants";
import { useSidebar } from "@/lib/contexts/sidebar-context";

export default function Sidebar() {
  const { isExpanded, setIsExpanded } = useSidebar();
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ width: isExpanded ? 256 : 80 }}
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-dark-elevated border-r border-gray-700 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.h1
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-bold text-white"
            >
              CarpentryQS
            </motion.h1>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-10 h-10 bg-electric-magenta rounded-lg flex items-center justify-center"
            >
              <span className="text-white font-bold text-lg">C</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationLinks.map((link) => {
            const isActive = pathname === link.href;
            
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                    ${isActive 
                      ? "bg-electric-magenta text-white font-medium shadow-lg shadow-electric-magenta/20" 
                      : "text-gray-400 hover:bg-dark-navy hover:text-white"
                    }
                  `}
                >
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap"
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
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 rounded-lg bg-dark-surface hover:bg-dark-navy transition-colors flex items-center justify-center text-gray-400 hover:text-white"
        >
          <span className="text-lg">
            {isExpanded ? "◀" : "▶"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}