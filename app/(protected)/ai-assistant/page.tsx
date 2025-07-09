"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import FileDropZone from "./components/FileDropZone";
import QuotePreview from "./components/QuotePreview";
import MCPSelector from "./components/MCPSelector";
import { useAuth } from "@clerk/nextjs";
import type { ChatMessage, FileAttachment, GeneratedQuote, MCPConnection } from "@/lib/ai-assistant/types";

export default function AIAssistantPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const fromSeniorEstimator = searchParams?.get('from') === 'senior-estimator';
  
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(null);
  const [mcpConnections, setMcpConnections] = useState<MCPConnection[]>([]);
  const [showMCPSelector, setShowMCPSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [seniorEstimatorData, setSeniorEstimatorData] = useState<any>(null);
  const [liveUpdates, setLiveUpdates] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const updatesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const scrollUpdatesToBottom = () => {
    updatesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    scrollUpdatesToBottom();
  }, [liveUpdates]);
  
  // Add live update helper with leprechaun theme
  const addLiveUpdate = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    // Add leprechaun-themed prefixes for junior estimator
    const prefixes = ['🍀', '✨', '💚', '🪙', '🌟', '🌈'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setLiveUpdates(prev => [...prev, `${prefix} [${timestamp}] ${message}`]);
  };

  // Load existing MCP connections and check for Senior Estimator data
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

    // Check for Senior Estimator takeoff data
    const checkSeniorEstimatorData = () => {
      const data = sessionStorage.getItem('senior_estimator_takeoff');
      if (data) {
        try {
          const takeoffData = JSON.parse(data);
          setSeniorEstimatorData(takeoffData);
          addLiveUpdate("📥 Received wisdom from the Senior Leprechaun!");
          addLiveUpdate(`📊 ${takeoffData.quantities.length} magical items to price with ${takeoffData.project_summary.confidence}% confidence`);
          
          // Auto-send a message to start the Junior Estimator workflow
          const autoMessage = `The Senior Leprechaun has blessed me with quantity takeoffs! Let me craft a detailed quote using our enchanted materials database and labor rates.

Project Summary:
- Scope: ${takeoffData.project_summary.scope}
- Project Type: ${takeoffData.project_summary.project_type}
- Location: ${takeoffData.project_summary.location}
- Overall Confidence: ${takeoffData.project_summary.confidence}%

Items to Price:
${takeoffData.quantities.map((item: any, index: number) => 
  `${index + 1}. ${item.description} - ${item.quantity} ${item.unit} (${item.confidence}% confidence)`
).join('\n')}

Let me search our treasure trove of materials for the best pricing!`;

          // Clear the session storage
          sessionStorage.removeItem('senior_estimator_takeoff');
          addLiveUpdate("🧚 Junior Leprechaun awakening...");
          
          // Send the auto message after a short delay
          setTimeout(() => {
            handleSendMessage(autoMessage);
          }, 1000);
          
        } catch (error) {
          console.error('Error parsing Senior Estimator data:', error);
        }
      }
    };

    if (userId) {
      loadMCPConnections();
      checkSeniorEstimatorData();
    }
  }, [userId]);

  const handleSendMessage = useCallback(async (content: string) => {
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
    addLiveUpdate("🧚 Junior Leprechaun thinking...");

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
      addLiveUpdate("💚 Junior wisdom delivered!");
      
      // If the response contains a quote draft, update the generated quote
      if (data.message.quoteDraft) {
        setGeneratedQuote(data.message.quoteDraft);
        addLiveUpdate("🪙 Quote treasure created!");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addLiveUpdate(`❌ Oops! ${error instanceof Error ? error.message : 'Magic failed'}`);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Oh dear! The magic fizzled: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [userId, sessionId, attachedFiles, addLiveUpdate]);

  const handleFileUpload = async (files: File[]) => {
    const newAttachments: FileAttachment[] = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'uploading' as const,
    }));

    setAttachedFiles(prev => [...prev, ...newAttachments]);
    addLiveUpdate(`📄 Receiving ${files.length} magical scroll${files.length > 1 ? 's' : ''}...`);
    
    // Track which files are BOQ files
    const boqFiles: FileAttachment[] = [];

    // Upload files
    for (const file of files) {
      const attachment = newAttachments.find(a => a.name === file.name);
      if (!attachment) continue;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/ai-assistant/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

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
          
          if (uploadedFile.content) {
            const updatedFile = {
              ...attachment,
              status: 'complete' as const,
              url: uploadedFile.url,
              content: uploadedFile.content,
              parseError: uploadedFile.parseError
            };
            boqFiles.push(updatedFile);
            addLiveUpdate(`✨ Scroll decoded: ${file.name}`);
          }
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (_error) {
        setAttachedFiles(prev => 
          prev.map(f => 
            f.id === attachment.id 
              ? { ...f, status: 'error' as const }
              : f
          )
        );
        addLiveUpdate(`❌ Failed to read scroll: ${file.name}`);
      }
    }
    
    // Automatically analyze BOQ files if any were successfully uploaded with content
    if (boqFiles.length > 0) {
      const autoMessage = `Please analyze the uploaded BOQ file${boqFiles.length > 1 ? 's' : ''} and create a magical quote!`;
      
      setTimeout(() => {
        handleSendMessage(autoMessage);
      }, 500);
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
      const response = await fetch(`/api/mcp/connections/${connectionId}/connect`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMcpConnections(prev => prev.filter(conn => conn.id !== connectionId));
      }
    } catch (error) {
      console.error('Error disconnecting MCP:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="flex items-center animate-pulse">
              <span className="text-4xl">🧑‍🦰</span>
              <span className="text-3xl -ml-3">🍀</span>
            </div> 
            <div>
              <div className="flex items-center gap-2">
                Junior Estimator
                <Badge variant="success" className="text-xs">Jr</Badge>
              </div>
              <p className="text-xs text-green-600 font-semibold italic">
                {"A wee bit of magic for your quotes!"}
              </p>
            </div>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {seniorEstimatorData || fromSeniorEstimator
              ? "Using Senior Leprechaun's wisdom to craft detailed quotes"
              : "Upload BOQ scrolls for magical quote generation"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-sm bg-green-100 text-green-800 border-green-300">
            🌟 AI Assistant
          </Badge>
          <Button
            onClick={() => setShowMCPSelector(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 relative"
          >
            <span>🔌</span>
            MCP Tools
            {mcpConnections.filter(c => c.status === 'connected').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {mcpConnections.filter(c => c.status === 'connected').length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Grid - Matching Senior Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 px-6 pb-4 min-h-0">
        {/* Left Column - Files & MCP (Small) */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              📜 BOQ Scrolls
            </h3>
            <div className="text-xs">
              <FileDropZone 
                onFileUpload={handleFileUpload}
                attachedFiles={attachedFiles}
                onRemoveFile={handleRemoveFile}
              />
            </div>
          </Card>

          {/* Live Updates */}
          <Card className="p-4 flex-1">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              ✨ Magical Updates
            </h3>
            <div className="h-48 overflow-y-auto bg-gray-50 rounded p-2 text-xs font-mono">
              {liveUpdates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Waiting for magic...</p>
              ) : (
                liveUpdates.map((update, index) => (
                  <div key={index} className="mb-1 text-gray-700">
                    {update}
                  </div>
                ))
              )}
              <div ref={updatesEndRef} />
            </div>
          </Card>

          {/* MCP Connections */}
          {mcpConnections.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                🔌 Magic Tools
              </h3>
              <div className="space-y-1">
                {mcpConnections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-1.5 rounded bg-gray-50 hover:bg-gray-100 transition-colors text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        conn.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">{conn.name}</span>
                    </div>
                    {conn.status === 'connected' && (
                      <button
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={() => handleMCPDisconnect(conn.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Middle Column - Chat Interface (Big) */}
        <div className="col-span-6 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              💬 Junior Leprechaun Chat
            </h3>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50 mb-4">
              {messages.length === 0 && !generatedQuote ? (
                <div className="text-center text-gray-500 py-16">
                  <div className="flex items-center justify-center mb-3 animate-bounce">
                    <span className="text-6xl">🧑‍🦰</span>
                    <span className="text-5xl -ml-4">🍀</span>
                  </div>
                  <p className="font-medium">Junior Leprechaun Ready!</p>
                  <p className="text-sm mt-2 text-green-600 italic">{"Upload your BOQ scrolls or ask me anything!"}</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <span className="text-2xl">✨</span>
                    <span className="text-2xl">🪙</span>
                    <span className="text-2xl">💚</span>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-3 p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-green-100 ml-12'
                          : 'bg-white mr-12 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={message.role === 'user' ? 'text-sm' : 'text-2xl'}>
                          {message.role === 'user' ? '👤' : '🧑‍🦰🍀'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {isProcessing && (
                <div className="mb-3 p-3 rounded-lg bg-white mr-12 shadow-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center animate-pulse">
                      <span className="text-2xl">🧑‍🦰</span>
                      <span className="text-xl -ml-2">🍀</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 italic">Junior Leprechaun is crafting magic...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder="Ask about materials, pricing, or upload BOQ files..."
                className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                disabled={isProcessing}
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isProcessing}
                size="sm"
              >
                Send
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Right Column - Quote Preview */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          {generatedQuote ? (
            <QuotePreview 
              quote={generatedQuote} 
              sessionId={sessionId}
              onQuoteCreated={(quoteId, quoteNumber) => {
                console.log(`Quote ${quoteNumber} created with ID: ${quoteId}`);
                addLiveUpdate(`🪙 Quote ${quoteNumber} saved to treasure chest!`);
              }}
            />
          ) : (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                📋 Quote Preview
              </h3>
              <div className="text-center text-muted-foreground py-8">
                <div className="text-4xl mb-3">🪙</div>
                <p className="text-sm">No quote generated yet</p>
                <p className="text-xs mt-2 text-green-600 italic">
                  {"The gold will appear when ready!"}
                </p>
              </div>
            </Card>
          )}

          {/* Senior Estimator Data Summary */}
          {seniorEstimatorData && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                🧑‍🦰🎩 From Senior Leprechaun
                <Badge variant="success" className="text-xs">
                  {seniorEstimatorData.quantities.length} items
                </Badge>
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-2 bg-green-50 rounded text-xs">
                  <p className="font-medium text-green-800">Project: {seniorEstimatorData.project_summary.project_type}</p>
                  <p className="text-green-600">Location: {seniorEstimatorData.project_summary.location}</p>
                  <p className="text-green-600">Confidence: {seniorEstimatorData.project_summary.confidence}%</p>
                </div>
                {seniorEstimatorData.quantities.slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="p-2 border rounded bg-gray-50 text-xs">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-gray-600">{item.quantity} {item.unit}</p>
                  </div>
                ))}
                {seniorEstimatorData.quantities.length > 5 && (
                  <p className="text-xs text-center text-gray-500 italic">
                    ...and {seniorEstimatorData.quantities.length - 5} more items
                  </p>
                )}
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