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
      initial={{ width: isExpanded ? 256 : 64 }}
      animate={{ width: isExpanded ? 256 : 64 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-background-secondary border-r border-border-default h-screen fixed left-0 top-0 z-50 flex flex-col"
    >
      {/* Logo / Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-default">
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
              className="w-8 h-8 bg-primary-light rounded flex items-center justify-center"
            >
              <span className="text-white font-bold">C</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    flex items-center px-2 py-2.5 rounded-lg transition-all duration-200
                    ${isActive 
                      ? "bg-primary-light/10 text-primary-light" 
                      : "text-text-secondary hover:bg-background-hover hover:text-text-primary"
                    }
                  `}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="ml-3 truncate"
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
      <div className="p-2 border-t border-border-default">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-background-hover hover:bg-background-card transition-colors duration-200"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
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