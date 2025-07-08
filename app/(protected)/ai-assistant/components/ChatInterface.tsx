"use client";

import { useState, useRef, useEffect } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import type { ChatMessage, FileAttachment } from "@/lib/ai-assistant/types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  attachedFiles?: FileAttachment[];
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isProcessing,
  attachedFiles = [],
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isProcessing) {
      onSendMessage(inputMessage.trim());
      setInputMessage("");
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
        {isProcessing && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-border pt-4 mt-4">
        <MessageInput
          value={inputMessage}
          onChange={setInputMessage}
          onSubmit={handleSubmit}
          disabled={isProcessing}
          attachedFiles={attachedFiles}
        />
      </div>
    </div>
  );
}