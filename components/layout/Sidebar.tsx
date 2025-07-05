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
      className="fixed left-0 top-0 z-40 h-screen flex flex-col bg-bg-secondary border-r border-border shadow-xl"
    >
      {/* Logo / Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.h1
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-xl font-bold text-text-primary"
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
              className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md"
            >
              <span className="text-bg-primary font-bold text-lg">C</span>
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
                      ? "bg-primary text-bg-primary shadow-md" 
                      : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                    }
                  `}
                >
                  <Icon className={`
                    w-5 h-5 flex-shrink-0 transition-colors duration-200
                    ${isActive ? "text-bg-primary" : "text-text-secondary group-hover:text-text-primary"}
                  `} />
                  <AnimatePresence mode="wait">
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
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

      {/* Expand/Collapse Toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover transition-colors duration-200 flex items-center justify-center"
        >
          {isExpanded ? (
            <ChevronLeftIcon className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-text-secondary" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}