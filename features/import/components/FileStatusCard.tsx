"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface FileStatusCardProps {
  file: {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: "preparing" | "uploading" | "processing" | "completed" | "failed";
    error?: string;
  };
  onRemove: () => void;
}

export default function FileStatusCard({ file, onRemove }: FileStatusCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case "preparing":
      case "uploading":
        return (
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-border-default"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={100}
                strokeDashoffset={100 - file.progress}
                className="text-primary-light transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
              {Math.round(file.progress)}%
            </span>
          </div>
        );
      case "processing":
        return <span className="text-2xl animate-spin">↻</span>;
      case "completed":
        return <span className="text-2xl text-success">✓</span>;
      case "failed":
        return <span className="text-2xl text-error">✗</span>;
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case "preparing":
        return "Preparing...";
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing with OCR...";
      case "completed":
        return "Ready for verification";
      case "failed":
        return file.error || "Upload failed";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        bg-background-card border rounded-lg p-4 flex items-center space-x-4
        ${file.status === "failed" ? "border-error/50" : "border-border-default"}
      `}
    >
      <span className="text-2xl flex-shrink-0">📄</span>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatFileSize(file.size)} • {getStatusText()}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        
        {(file.status === "completed" || file.status === "failed") && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onRemove}
            className="text-muted hover:text-error"
          >
            <span>🗑</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}