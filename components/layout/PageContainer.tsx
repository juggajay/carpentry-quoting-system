"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  title,
  description,
  actions,
  className = "",
}: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`space-y-3 ${className}`}
    >
      {/* Page Header */}
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm sm:text-base text-slate-400">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div className="animate-fade-in">
        {children}
      </div>
    </motion.div>
  );
}