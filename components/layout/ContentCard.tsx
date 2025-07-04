"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ContentCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  noPadding?: boolean;
  variant?: "default" | "ghost" | "bordered";
}

export default function ContentCard({
  children,
  title,
  description,
  actions,
  className = "",
  noPadding = false,
  variant = "default",
}: ContentCardProps) {
  const variants = {
    default: "bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl",
    ghost: "bg-transparent border-transparent",
    bordered: "bg-transparent border-gray-700 shadow-md hover:shadow-lg",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        rounded-xl border transition-all duration-300
        ${variants[variant]}
        ${className}
      `}
    >
      {/* Card Header */}
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-gray-700">
          <div>
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-gray-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-400">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className={noPadding ? "" : "p-6"}>
        {children}
      </div>
    </motion.div>
  );
}