"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/ai-assistant/types";
import ConfidenceIndicator from "./ConfidenceIndicator";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isUser 
            ? "bg-electric-magenta text-white" 
            : "bg-background-secondary text-foreground"
        )}
      >
        <div className="space-y-2">
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    isUser ? "bg-white/20" : "bg-background"
                  )}
                >
                  📎 {file.name}
                  {file.status === 'uploading' && ' (uploading...)'}
                  {file.status === 'error' && ' (error)'}
                </div>
              ))}
            </div>
          )}
          
          {message.confidence && (
            <div className="mt-2">
              <ConfidenceIndicator confidence={message.confidence} />
            </div>
          )}
        </div>
        
        <div className={cn(
          "text-xs mt-2",
          isUser ? "text-white/70" : "text-muted-foreground"
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}