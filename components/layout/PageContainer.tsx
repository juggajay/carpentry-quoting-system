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
              <h1 className="text-h2 sm:text-h1 text-text-primary">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-body-sm sm:text-body text-text-secondary">
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