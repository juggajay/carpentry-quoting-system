"use client";

import { Button } from "@/components/ui/Button";
import type { FileAttachment } from "@/lib/ai-assistant/types";

interface FilePreviewProps {
  file: FileAttachment;
  onRemove: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('spreadsheet') || type.includes('csv')) return '📊';
    if (type.includes('word')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getFileIcon(file.type)}</span>
        <div>
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
            {file.status === 'uploading' && ' • Uploading...'}
            {file.status === 'processing' && ' • Processing...'}
            {file.status === 'error' && ' • Error'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {file.status === 'uploading' && (
          <div className="w-4 h-4 border-2 border-electric-magenta border-t-transparent rounded-full animate-spin" />
        )}
        {file.status === 'complete' && (
          <span className="text-green-500">✓</span>
        )}
        {file.status === 'error' && (
          <span className="text-red-500">✗</span>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}