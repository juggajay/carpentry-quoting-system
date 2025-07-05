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
    <motion.div
      initial={{ width: isExpanded ? 256 : 80 }}
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-slate-900 border-r border-slate-800 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-slate-800">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.h1
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-bold"
            >
              CarpentryQS
            </motion.h1>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center"
            >
              <span className="text-slate-950 font-bold text-lg">C</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? "bg-green-500 text-slate-950" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
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
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center"
        >
          {isExpanded ? (
            <ChevronLeftIcon className="w-5 h-5" />
          ) : (
            <ChevronRightIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </motion.div>
  );
}