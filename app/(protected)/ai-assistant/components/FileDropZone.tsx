"use client";

import { useCallback, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { simpleLog } from "@/components/simple-debug";
import type { FileAttachment } from "@/lib/ai-assistant/types";
import FilePreview from "./FilePreview";

interface FileDropZoneProps {
  onFileUpload: (files: File[]) => void;
  attachedFiles: FileAttachment[];
  onRemoveFile: (fileId: string) => void;
}

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.xlsx,.csv';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileDropZone({ 
  onFileUpload, 
  attachedFiles,
  onRemoveFile 
}: FileDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    simpleLog(`FileDropZone: ${files.length} file(s)`);

    const validFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        simpleLog(`File too large: ${file.name}`);
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }
      simpleLog(`Valid file: ${file.name}`);
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      simpleLog(`Passing ${validFiles.length} file(s) up`);
      onFileUpload(validFiles);
    } else {
      simpleLog('No valid files');
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    simpleLog(`DROP EVENT: ${e.dataTransfer.files.length} files`);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) {
      simpleLog('DRAG OVER');
    }
    setIsDragActive(true);
  }, [isDragActive]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    simpleLog('DRAG LEAVE');
  }, []);

  const handleClick = () => {
    simpleLog('CLICK TO SELECT');
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    simpleLog('FILE INPUT CHANGED');
    handleFiles(e.target.files);
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-electric-magenta bg-electric-magenta/10"
            : "border-border hover:border-electric-magenta/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleChange}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-4xl">📎</div>
          <p className="text-foreground font-medium">
            {isDragActive ? "Drop the files here..." : "Drop BOQ files here..."}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select files
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: PDF, DOCX, XLSX, CSV (max 10MB)
          </p>
        </div>
      </div>

      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Attached Files</h3>
          <div className="space-y-2">
            {attachedFiles.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={() => onRemoveFile(file.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}