"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import FileDropZone from "../ai-assistant/components/FileDropZone";
import type { FileAttachment, ChatMessage } from "@/lib/ai-assistant/types";

interface SeniorEstimatorResult {
  scope_analysis: {
    extractedItems: any[];
    ambiguities: any[];
    completeness: number;
    confidence: { score: number; indicator: string };
  };
  drawing_analyses: any[];
  questions: any[];
  quote_items: any[];
  confidence_summary: {
    overall_confidence: { score: number; indicator: string };
    high_confidence_items: number;
    medium_confidence_items: number;
    low_confidence_items: number;
    items_requiring_review: number;
  };
  should_proceed: boolean;
  estimated_duration: string;
  next_steps: string[];
}

export default function SeniorEstimatorPage() {
  const { userId } = useAuth();
  
  // State management
  const [scopeText, setScopeText] = useState("");
  const [projectType, setProjectType] = useState<'residential' | 'commercial' | 'industrial'>('residential');
  const [location, setLocation] = useState("NSW, Australia");
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SeniorEstimatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // AI Chat Interface State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const updatesEndRef = useRef<HTMLDivElement>(null);
  
  // Collapsible states
  const [filesOpen, setFilesOpen] = useState(true);
  const [updatesOpen, setUpdatesOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(true);
  
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
    const prefixes = ['🍀', '💰', '🌈', '✨', '🪙'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setLiveUpdates(prev => [...prev, `${prefix} [${timestamp}] ${message}`]);
  };

  const handleFileUpload = async (files: File[]) => {
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

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/ai-assistant/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
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
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleAnalyze = async () => {
    if (!scopeText.trim()) {
      setError("Please enter a scope of work");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    addLiveUpdate("🔍 Starting project analysis...");

    try {
      addLiveUpdate("📋 Parsing scope of work...");
      const response = await fetch('/api/test-senior-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope_text: scopeText,
          project_type: projectType,
          location: location,
          drawing_files: attachedFiles.filter(f => f.content)
        }),
      });

      const data = await response.json();
      addLiveUpdate("⚡ Processing with Senior Leprechaun magic...");

      if (response.ok && data.success) {
        addLiveUpdate("✅ Analysis complete! Reviewing confidence scores...");
        setResult(data.results);
        addLiveUpdate(`📊 Found ${data.results.quote_items.length} items with ${data.results.confidence_summary.overall_confidence.score}% confidence`);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Senior Estimator error:', error);
      addLiveUpdate(`❌ Error: ${error instanceof Error ? error.message : 'Analysis failed'}`);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // AI Chat Handler
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);
    addLiveUpdate("🧑‍🦰🍀 Senior Leprechaun thinking...");

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          attachments: attachedFiles,
          context: { 
            userId,
            skipSeniorEstimator: true,
            seniorEstimatorContext: {
              scopeText,
              projectType,
              location,
              result
            }
          }
        }),
      });

      const data = await response.json();
      addLiveUpdate("💭 Wisdom delivered");

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message || 'No response generated',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Chat request failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addLiveUpdate(`❌ Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendToJuniorEstimator = async () => {
    if (!result) return;

    try {
      const takeoffData = {
        project_summary: {
          scope: scopeText,
          project_type: projectType,
          location: location,
          confidence: result.confidence_summary.overall_confidence.score,
          should_proceed: result.should_proceed
        },
        quantities: result.quote_items.map(item => ({
          id: item.id || crypto.randomUUID(),
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          confidence: item.confidence,
          source: item.source || 'Senior Estimator calculation',
          notes: item.notes || ''
        })),
        questions: result.questions,
        analysis_notes: result.next_steps,
        estimated_duration: result.estimated_duration
      };

      sessionStorage.setItem('senior_estimator_takeoff', JSON.stringify(takeoffData));
      window.location.href = '/ai-assistant?from=senior-estimator';
      
    } catch (error) {
      console.error('Error sending to Junior Estimator:', error);
      setError('Failed to send to Junior Estimator');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className="text-3xl">🧑‍🦰</span>
                <span className="text-2xl -ml-2">🍀</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Senior Estimator
                </h1>
                <p className="text-xs text-muted-foreground">
                  Analyze scope → Generate takeoffs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as 'residential' | 'commercial' | 'industrial')}
                className="text-sm px-2 py-1 border rounded bg-background"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="w-32 text-sm"
              />
              <Badge variant="info" className="text-xs">
                🌈 NSW Standards 🎩
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Files & Live Updates */}
        <div className="w-80 border-r bg-muted/10 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Files Section */}
            <Collapsible open={filesOpen} onOpenChange={setFilesOpen}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      📐 Project Files
                      {attachedFiles.length > 0 && (
                        <Badge variant="default" className="text-xs">
                          {attachedFiles.length}
                        </Badge>
                      )}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {filesOpen ? '▼' : '▶'}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 pt-0">
                    <FileDropZone 
                      onFileUpload={handleFileUpload}
                      attachedFiles={attachedFiles}
                      onRemoveFile={handleRemoveFile}
                    />
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Live Updates */}
            <Collapsible open={updatesOpen} onOpenChange={setUpdatesOpen}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      ✨ Live Updates
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {updatesOpen ? '▼' : '▶'}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 pt-0">
                    <div className="h-64 overflow-y-auto bg-muted/50 rounded p-2 text-xs font-mono">
                      {liveUpdates.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Waiting for magic...
                        </p>
                      ) : (
                        liveUpdates.map((update, index) => (
                          <div key={index} className="mb-1">
                            {update}
                          </div>
                        ))
                      )}
                      <div ref={updatesEndRef} />
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>

        {/* Center - Main Chat */}
        <div className="flex-1 flex flex-col">
          {/* Scope Input Bar */}
          <div className="border-b p-4">
            <div className="flex gap-2">
              <Input
                value={scopeText}
                onChange={(e) => setScopeText(e.target.value)}
                placeholder="Enter construction scope of work..."
                className="flex-1"
              />
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !scopeText.trim()}
                className="px-6"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">⚙️</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
                    Analyze
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && !result ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-5xl">🧑‍🦰</span>
                    <span className="text-4xl -ml-3">🍀</span>
                    <span className="text-3xl ml-2">💰</span>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">
                    Senior Leprechaun Ready
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {"Enter your scope above to begin the magic"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center">
                        <span className="text-xl">🧑‍🦰</span>
                        <span className="text-lg -ml-2">🍀</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <span className="text-sm">👤</span>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex items-center animate-pulse">
                      <span className="text-xl">🧑‍🦰</span>
                      <span className="text-lg -ml-2">🍀</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground italic">
                        Consulting the leprechaun wisdom...
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t p-4">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about materials, quantities, or standards..."
                className="flex-1"
                disabled={isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Results */}
        {result && (
          <div className="w-96 border-l bg-muted/10 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Summary Card */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3">Analysis Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Confidence</span>
                    <Badge 
                      variant={result.confidence_summary.overall_confidence.score >= 85 ? 'success' : 'warning'}
                    >
                      {result.confidence_summary.overall_confidence.score}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold">{result.confidence_summary.high_confidence_items}</div>
                      <div className="text-muted-foreground">High</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-semibold">{result.confidence_summary.medium_confidence_items}</div>
                      <div className="text-muted-foreground">Medium</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-semibold">{result.confidence_summary.low_confidence_items}</div>
                      <div className="text-muted-foreground">Low</div>
                    </div>
                  </div>
                  {result.should_proceed && (
                    <Button
                      onClick={handleSendToJuniorEstimator}
                      className="w-full"
                      size="sm"
                    >
                      🍀 Send to Junior Leprechaun 🪙
                    </Button>
                  )}
                </div>
              </Card>

              {/* Takeoffs */}
              <Collapsible open={resultsOpen} onOpenChange={setResultsOpen}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        📋 Takeoffs
                        <Badge variant="default" className="text-xs">
                          {result.quote_items.length}
                        </Badge>
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {resultsOpen ? '▼' : '▶'}
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 pt-0 space-y-2 max-h-96 overflow-y-auto">
                      {result.quote_items.map((item, index) => (
                        <div 
                          key={index} 
                          className="p-2 border rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => setInputValue(`Tell me more about: ${item.description}`)}
                        >
                          <p className="text-sm font-medium">{item.description}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">
                              {item.quantity} {item.unit}
                            </span>
                            <Badge 
                              variant={item.confidence >= 85 ? 'success' : item.confidence >= 70 ? 'warning' : 'error'} 
                              className="text-xs"
                            >
                              {item.confidence}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Questions */}
              {result.questions && result.questions.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    ❓ Questions
                    <Badge variant="warning" className="text-xs">
                      {result.questions.length}
                    </Badge>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.questions.map((question, index) => (
                      <div 
                        key={index} 
                        className="p-2 border-l-2 border-yellow-400 bg-yellow-50 rounded hover:bg-yellow-100 cursor-pointer"
                        onClick={() => setInputValue(question.question)}
                      >
                        <p className="text-sm">{question.question}</p>
                        {question.options && question.options.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {question.options.map((option: string, optIndex: number) => (
                              <button
                                key={optIndex}
                                className="px-2 py-0.5 text-xs bg-yellow-200 hover:bg-yellow-300 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInputValue(`${question.question} Answer: ${option}`);
                                }}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}