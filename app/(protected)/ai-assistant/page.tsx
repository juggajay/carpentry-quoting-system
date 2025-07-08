"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import ChatInterface from "./components/ChatInterface";
import FileDropZone from "./components/FileDropZone";
import QuotePreview from "./components/QuotePreview";
import MCPSelector from "./components/MCPSelector";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@clerk/nextjs";
import type { ChatMessage, FileAttachment, GeneratedQuote, MCPConnection } from "@/lib/ai-assistant/types";

export default function AIAssistantPage() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [generatedQuote] = useState<GeneratedQuote | null>(null);
  const [mcpConnections, setMcpConnections] = useState<MCPConnection[]>([]);
  const [showMCPSelector, setShowMCPSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!userId) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages(prev => [...prev, newMessage]);
    setAttachedFiles([]); // Clear attachments after sending

    // TODO: Implement API call to process message
    setIsProcessing(true);
    
    // Simulate response for now
    setTimeout(() => {
      const response: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I've received your message. In the full implementation, I'll process your files and help generate a quote.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
      setIsProcessing(false);
    }, 1000);
  };

  const handleFileUpload = (files: File[]) => {
    const newAttachments: FileAttachment[] = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'uploading' as const,
    }));

    setAttachedFiles(prev => [...prev, ...newAttachments]);

    // TODO: Implement actual file upload
    // For now, simulate upload completion
    setTimeout(() => {
      setAttachedFiles(prev => 
        prev.map(file => 
          newAttachments.find(nf => nf.id === file.id) 
            ? { ...file, status: 'complete' as const }
            : file
        )
      );
    }, 2000);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleMCPConnect = (connection: MCPConnection) => {
    setMcpConnections(prev => [...prev, connection]);
    setShowMCPSelector(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Quote Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Upload BOQ files and let AI help you generate accurate quotes
          </p>
        </div>
        <Button
          onClick={() => setShowMCPSelector(true)}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <span className="text-lg">🔌</span>
          Add MCP
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <FileDropZone 
              onFileUpload={handleFileUpload}
              attachedFiles={attachedFiles}
              onRemoveFile={handleRemoveFile}
            />
          </Card>

          <Card className="p-6">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              attachedFiles={attachedFiles}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          {generatedQuote ? (
            <QuotePreview quote={generatedQuote} />
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-4">📋</div>
                <p>No quote generated yet</p>
                <p className="text-sm mt-2">
                  Upload BOQ files and interact with the AI to generate a quote
                </p>
              </div>
            </Card>
          )}

          {mcpConnections.length > 0 && (
            <Card className="p-4 mt-6">
              <h3 className="font-semibold mb-3">Active Connections</h3>
              <div className="space-y-2">
                {mcpConnections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between text-sm">
                    <span>{conn.name}</span>
                    <span className={`
                      ${conn.status === 'connected' ? 'text-green-500' : ''}
                      ${conn.status === 'error' ? 'text-red-500' : ''}
                      ${conn.status === 'disconnected' ? 'text-gray-500' : ''}
                    `}>
                      {conn.status === 'connected' && '🟢'}
                      {conn.status === 'error' && '🔴'}
                      {conn.status === 'disconnected' && '⚫'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {showMCPSelector && (
        <MCPSelector
          onClose={() => setShowMCPSelector(false)}
          onConnect={handleMCPConnect}
          existingConnections={mcpConnections}
        />
      )}
    </div>
  );
}