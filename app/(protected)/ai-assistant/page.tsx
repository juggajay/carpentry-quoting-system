"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
  const [showMobileUpdates, setShowMobileUpdates] = useState(false);
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
          addLiveUpdate("Initializing AI Assistant...");
          
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
    addLiveUpdate("Processing request...");

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
    <div className="h-screen flex flex-col bg-dark-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-dark-elevated border-b border-dark-border">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center">
              <span className="text-2xl">🧑‍🦰</span>
              <span className="text-xl -ml-2">🍀</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                Junior Estimator
                <Badge variant="success" className="text-xs">AI</Badge>
              </h1>
              <p className="text-sm text-dark-text-secondary">
                {seniorEstimatorData || fromSeniorEstimator
                  ? "Creating detailed quotes from takeoff data"
                  : "Upload BOQ files for AI-powered quote generation"
                }
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowMCPSelector(true)}
            variant="secondary"
            size="sm"
            className="relative"
          >
            <span className="mr-2">🔌</span>
            MCP Tools
            {mcpConnections.filter(c => c.status === 'connected').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-electric-magenta text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {mcpConnections.filter(c => c.status === 'connected').length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6">
          {/* Left Column - Files & MCP */}
          <div className="lg:col-span-3 space-y-4 overflow-y-auto order-2 lg:order-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  📜 BOQ Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileDropZone 
                  onFileUpload={handleFileUpload}
                  attachedFiles={attachedFiles}
                  onRemoveFile={handleRemoveFile}
                />
              </CardContent>
            </Card>

            {/* Live Updates - Hidden on mobile by default */}
            <Card className="hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  ✨ Live Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 overflow-y-auto bg-dark-surface border border-dark-border rounded-lg p-3 text-xs font-mono">
                  {liveUpdates.length === 0 ? (
                    <p className="text-dark-text-secondary text-center py-8">Waiting for updates...</p>
                  ) : (
                    liveUpdates.map((update, index) => (
                      <div key={index} className="mb-1 text-electric-magenta">
                        {update}
                      </div>
                    ))
                  )}
                  <div ref={updatesEndRef} />
                </div>
              </CardContent>
            </Card>

            {/* MCP Connections */}
            {mcpConnections.length > 0 && (
              <Card className="hidden lg:block">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    🔌 Connected Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mcpConnections.map(conn => (
                      <div key={conn.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-surface hover:bg-dark-surface/80 border border-dark-border transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            conn.status === 'connected' ? 'bg-success-green animate-pulse' : 'bg-dark-text-secondary'
                          }`} />
                          <span className="text-sm font-medium text-white">{conn.name}</span>
                        </div>
                        {conn.status === 'connected' && (
                          <button
                            className="text-critical-red hover:text-critical-red/80 transition-colors"
                            onClick={() => handleMCPDisconnect(conn.id)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle Column - Chat Interface */}
          <div className="lg:col-span-6 flex flex-col min-h-0 order-1 lg:order-2">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl">
                  💬 AI Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6">
            
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-dark-surface border border-dark-border rounded-lg p-4 mb-4">
                  {messages.length === 0 && !generatedQuote ? (
                    <div className="text-center py-12">
                      <div className="flex items-center justify-center mb-4">
                        <span className="text-4xl">🧑‍🦰</span>
                        <span className="text-3xl -ml-3">🍀</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">AI Assistant Ready</h3>
                      <p className="text-dark-text-secondary text-sm max-w-md mx-auto">
                        Upload BOQ files or ask questions about materials, labor rates, and pricing.
                      </p>
                    </div>
                  ) : (
                <>
                      {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`mb-4 flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-[85%] sm:max-w-[70%] ${
                          message.role === 'user'
                            ? 'order-2'
                            : 'order-1'
                        }`}>
                          <div className={`p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-electric-magenta text-white'
                              : 'bg-dark-elevated border border-dark-border'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className={`text-xs text-dark-text-secondary mt-1 ${
                            message.role === 'user' ? 'text-right' : 'text-left'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </>
              )}
                  {isProcessing && (
                    <div className="flex justify-start mb-4">
                      <div className="max-w-[85%] sm:max-w-[70%]">
                        <div className="p-3 rounded-lg bg-dark-elevated border border-dark-border">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-electric-magenta border-t-transparent"></div>
                            <p className="text-sm text-dark-text-secondary">AI is thinking...</p>
                          </div>
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
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
                        e.preventDefault();
                        handleSendMessage(inputValue);
                        setInputValue("");
                      }
                    }}
                    placeholder="Ask about materials, pricing, or upload BOQ files..."
                    className="flex-1 px-4 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-magenta focus:border-transparent transition-all"
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={() => {
                      if (inputValue.trim()) {
                        handleSendMessage(inputValue);
                        setInputValue("");
                      }
                    }}
                    disabled={!inputValue.trim() || isProcessing}
                    size="md"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        
          {/* Right Column - Quote Preview */}
          <div className="lg:col-span-3 space-y-4 overflow-y-auto order-3">
            {generatedQuote ? (
              <QuotePreview 
                quote={generatedQuote} 
                sessionId={sessionId}
                onQuoteCreated={(quoteId, quoteNumber) => {
                  console.log(`Quote ${quoteNumber} created with ID: ${quoteId}`);
                  addLiveUpdate(`✅ Quote ${quoteNumber} saved successfully!`);
                }}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📋 Quote Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-dark-text-secondary text-sm">
                      No quote generated yet
                    </p>
                    <p className="text-xs text-dark-text-secondary mt-2">
                      Upload files or chat to create a quote
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Senior Estimator Data Summary */}
            {seniorEstimatorData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📊 Takeoff Data
                    <Badge variant="success" className="text-xs">
                      {seniorEstimatorData.quantities.length} items
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <div className="p-3 bg-success-green/10 border border-success-green/20 rounded-lg">
                      <p className="font-medium text-success-green text-sm">Project: {seniorEstimatorData.project_summary.project_type}</p>
                      <p className="text-dark-text-secondary text-xs mt-1">Location: {seniorEstimatorData.project_summary.location}</p>
                      <p className="text-dark-text-secondary text-xs">Confidence: {seniorEstimatorData.project_summary.confidence}%</p>
                    </div>
                    {seniorEstimatorData.quantities.slice(0, 5).map((item: any, index: number) => (
                      <div key={index} className="p-3 border border-dark-border rounded-lg bg-dark-surface">
                        <p className="font-medium text-white text-sm">{item.description}</p>
                        <p className="text-dark-text-secondary text-xs mt-1">{item.quantity} {item.unit}</p>
                      </div>
                    ))}
                    {seniorEstimatorData.quantities.length > 5 && (
                      <p className="text-xs text-center text-dark-text-secondary italic mt-2">
                        ...and {seniorEstimatorData.quantities.length - 5} more items
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Live Updates Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowMobileUpdates(!showMobileUpdates)}
          variant="secondary"
          size="icon"
          className="shadow-lg"
        >
          ✨
        </Button>
      </div>

      {/* Mobile Live Updates Drawer */}
      {showMobileUpdates && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-dark-elevated border-t border-dark-border rounded-t-xl shadow-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Live Updates</h3>
              <button
                onClick={() => setShowMobileUpdates(false)}
                className="text-dark-text-secondary hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-48 overflow-y-auto bg-dark-surface border border-dark-border rounded-lg p-3 text-xs font-mono">
              {liveUpdates.length === 0 ? (
                <p className="text-dark-text-secondary text-center py-8">Waiting for updates...</p>
              ) : (
                liveUpdates.map((update, index) => (
                  <div key={index} className="mb-1 text-electric-magenta">
                    {update}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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