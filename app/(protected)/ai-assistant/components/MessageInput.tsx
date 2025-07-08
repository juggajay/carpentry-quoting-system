"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { FileAttachment } from "@/lib/ai-assistant/types";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  attachedFiles?: FileAttachment[];
}

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  attachedFiles = [],
}: MessageInputProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="text-xs bg-background-secondary px-2 py-1 rounded flex items-center gap-1"
            >
              📎 {file.name}
              {file.status === 'uploading' && (
                <span className="text-muted-foreground">(uploading...)</span>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-6"
        >
          Send
        </Button>
      </div>
    </form>
  );
}