"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import ChatInterface from "./components/ChatInterface";
import FileDropZone from "./components/FileDropZone";
import QuotePreview from "./components/QuotePreview";
import MCPSelector from "./components/MCPSelector";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@clerk/nextjs";
import { DebugIndicator } from "./components/DebugIndicator";
import type { ChatMessage, FileAttachment, GeneratedQuote, MCPConnection } from "@/lib/ai-assistant/types";

export default function AIAssistantPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const isDebug = searchParams?.get('debug') === 'true';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [generatedQuote] = useState<GeneratedQuote | null>(null);
  const [mcpConnections, setMcpConnections] = useState<MCPConnection[]>([]);
  const [showMCPSelector, setShowMCPSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [debugStatus, setDebugStatus] = useState('READY');

  // Load existing MCP connections on component mount
  useEffect(() => {
    const loadMCPConnections = async () => {
      try {
        const response = await fetch('/api/mcp/connections');
        if (response.ok) {
          const connections = await response.json();
          setMcpConnections(connections.map((conn: { id: string; name: string; type: string; status: string }) => ({
            id: conn.id,
            name: conn.name,
            type: conn.type,
            status: conn.status === 'active' ? 'connected' : 'disconnected',
          })));
        }
      } catch (error) {
        console.error('Error loading MCP connections:', error);
      }
    };

    if (userId) {
      loadMCPConnections();
    }
  }, [userId]);

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
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: sessionId,
          attachments: newMessage.attachments,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      // Store session ID if it's the first message
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Add the AI response to messages
      setMessages(prev => [...prev, data.message]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (isDebug) setDebugStatus(`DROPPED: ${files.length}`);

    const newAttachments: FileAttachment[] = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'uploading' as const,
    }));

    setAttachedFiles(prev => [...prev, ...newAttachments]);

    // Upload files
    for (const file of files) {
      const attachment = newAttachments.find(a => a.name === file.name);
      if (!attachment) continue;

      if (isDebug) setDebugStatus('UPLOADING');

      try {
        const formData = new FormData();
        formData.append('file', file);

        if (isDebug) setDebugStatus('CALLING API');

        const response = await fetch('/api/ai-assistant/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (isDebug) setDebugStatus(`RESPONSE: ${response.status}`);

        if (response.ok) {
          // Get the file data from the response
          const uploadedFile = data.files?.[0] || data;
          
          setAttachedFiles(prev => 
            prev.map(f => 
              f.id === attachment.id 
                ? { 
                    ...f, 
                    status: 'complete' as const, 
                    url: uploadedFile.url,
                    content: uploadedFile.content,
                    parseError: uploadedFile.parseError
                  }
                : f
            )
          );
          if (isDebug) setDebugStatus('SUCCESS');
          
          // Log the extracted content for debugging
          if (uploadedFile.content) {
            console.log(`[Upload] Extracted ${uploadedFile.content.length} characters from ${file.name}`);
          } else {
            console.log(`[Upload] No content extracted from ${file.name}`);
          }
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (error) {
        if (isDebug) setDebugStatus(`ERROR: ${error instanceof Error ? error.message : 'ERROR'}`);
        
        setAttachedFiles(prev => 
          prev.map(f => 
            f.id === attachment.id 
              ? { ...f, status: 'error' as const }
              : f
          )
        );
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleMCPConnect = (connection: MCPConnection) => {
    setMcpConnections(prev => [...prev, connection]);
    setShowMCPSelector(false);
  };

  const handleMCPDisconnect = async (connectionId: string) => {
    try {
      console.log('Disconnecting MCP:', connectionId);
      const response = await fetch(`/api/mcp/connections/${connectionId}/connect`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMcpConnections(prev => prev.filter(conn => conn.id !== connectionId));
        console.log('MCP disconnected successfully');
      } else {
        console.error('Failed to disconnect MCP:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error disconnecting MCP:', error);
    }
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
          className="flex items-center gap-2 relative"
        >
          <span className="text-lg">🔌</span>
          Add MCP
          {mcpConnections.filter(c => c.status === 'connected').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {mcpConnections.filter(c => c.status === 'connected').length}
            </span>
          )}
        </Button>
      </div>

      {/* Debug indicator */}
      {isDebug && (
        <DebugIndicator 
          status={debugStatus} 
          color={debugStatus.includes('ERROR') ? 'red' : debugStatus.includes('SUCCESS') ? 'green' : 'yellow'}
        />
      )}

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
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">🔌</span>
                Active Connections
              </h3>
              <div className="space-y-2">
                {mcpConnections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-elevated/50 hover:bg-dark-elevated transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${
                        conn.status === 'connected' ? 'bg-green-500' : ''
                      }${
                        conn.status === 'error' ? 'bg-red-500' : ''
                      }${
                        conn.status === 'disconnected' ? 'bg-gray-500' : ''
                      }`} />
                      <span className="text-sm font-medium">{conn.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        conn.status === 'connected' ? 'bg-green-500/20 text-green-500' : ''
                      }${
                        conn.status === 'error' ? 'bg-red-500/20 text-red-500' : ''
                      }${
                        conn.status === 'disconnected' ? 'bg-gray-500/20 text-gray-500' : ''
                      }`}>
                        {conn.status}
                      </span>
                      {conn.status === 'connected' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs hover:bg-red-500/20 hover:text-red-500"
                          onClick={() => handleMCPDisconnect(conn.id)}
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
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