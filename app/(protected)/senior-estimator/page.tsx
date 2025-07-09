"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import FileDropZone from "../ai-assistant/components/FileDropZone";
import { Input } from "@/components/ui/Input";
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
  
  // Add live update helper
  const addLiveUpdate = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    // Add leprechaun-themed prefixes randomly
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
      } catch (error) {
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
      addLiveUpdate("⚡ Processing with AI Senior Estimator...");

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
    addLiveUpdate("🤖 AI Senior Estimator thinking...");

    try {
      // Include current context in the message
      const contextualMessage = `Context: I'm working on a ${projectType} project in ${location}. 

Scope: ${scopeText || 'No scope entered yet'}

Attached Files: ${attachedFiles.length} files

Current Analysis: ${result ? `${result.quote_items.length} items analyzed with ${result.confidence_summary.overall_confidence.score}% confidence` : 'No analysis yet'}

Question: ${inputValue}`;

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
      addLiveUpdate("💭 AI response received");

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
      // Format the data for the Junior Estimator
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

      // Store in session storage for the Junior Estimator to pick up
      sessionStorage.setItem('senior_estimator_takeoff', JSON.stringify(takeoffData));
      
      // Navigate to AI Assistant (Junior Estimator)
      window.location.href = '/ai-assistant?from=senior-estimator';
      
    } catch (error) {
      console.error('Error sending to Junior Estimator:', error);
      setError('Failed to send to Junior Estimator');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-6 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <span className="text-6xl animate-bounce">🍀</span> 
            <div>
              <div className="flex items-center gap-2">
                Senior Estimator
                <span className="text-5xl">🧙‍♂️</span>
              </div>
              <p className="text-xs text-green-600 font-semibold italic">
                "Top o' the mornin' to your quotes!"
              </p>
            </div>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Analyze construction scope & drawings → Generate quantity takeoffs
          </p>
        </div>
        <Badge variant="info" className="text-sm bg-green-100 text-green-800 border-green-300">
          🌈 NSW Construction Standards
        </Badge>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 px-6 pb-4 min-h-0">
        {/* Left Column - Files & Settings (Small) */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              ⚙️ Project Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-foreground">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as 'residential' | 'commercial' | 'industrial')}
                  className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                >
                  <option value="residential" className="bg-background text-foreground">Residential</option>
                  <option value="commercial" className="bg-background text-foreground">Commercial</option>
                  <option value="industrial" className="bg-background text-foreground">Industrial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Location</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="NSW, Australia"
                  className="text-sm"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              📐 Project Files
            </h3>
            <div className="text-xs">
              <FileDropZone 
                onFileUpload={handleFileUpload}
                attachedFiles={attachedFiles}
                onRemoveFile={handleRemoveFile}
              />
            </div>
          </Card>

          {/* Live Updates moved to small column */}
          <Card className="p-4 flex-1">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              📡 Live Updates
            </h3>
            <div className="h-48 overflow-y-auto bg-gray-50 rounded p-2 text-xs font-mono">
              {liveUpdates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activity yet...</p>
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
        </div>

        {/* Middle Column - Chat Interface (Big) */}
        <div className="col-span-6 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                💬 AI Conversation
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={scopeText}
                  onChange={(e) => setScopeText(e.target.value)}
                  placeholder="Describe the construction scope..."
                  className="w-96 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !scopeText.trim()}
                  size="sm"
                >
                  {isAnalyzing ? (
                    <span className="animate-spin">⚙️</span>
                  ) : (
                    '🔍 Analyze'
                  )}
                </Button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50 mb-4">
              {error && (
                <div className="mb-4 p-3 border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <span>❌</span>
                    <span className="font-medium text-sm">Error: {error}</span>
                  </div>
                </div>
              )}
              
              {messages.length === 0 && !result ? (
                <div className="text-center text-gray-500 py-16">
                  <div className="text-8xl mb-3 animate-pulse">🧙‍♂️</div>
                  <p className="font-medium text-lg">The Great Leprechaun Estimator Awaits!</p>
                  <p className="text-sm mt-2 text-green-600 italic">"Share your construction dreams, and I'll count the gold coins needed!"</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <span className="text-3xl">🍀</span>
                    <span className="text-3xl">💰</span>
                    <span className="text-3xl">🌈</span>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-3 p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-100 ml-12'
                          : 'bg-white mr-12 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={message.role === 'user' ? 'text-sm' : 'text-3xl'}>
                          {message.role === 'user' ? '👤' : '🧙‍♂️'}
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
                  
                  {result && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-3xl">🧙‍♂️</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-3">Analysis Complete!</p>
                          
                          {/* Summary Stats */}
                          <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-semibold">{result.quote_items.length}</div>
                              <div className="text-gray-600">Items</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-semibold text-green-700">{result.confidence_summary.high_confidence_items}</div>
                              <div className="text-gray-600">High Conf</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 rounded">
                              <div className="font-semibold text-yellow-700">{result.confidence_summary.medium_confidence_items}</div>
                              <div className="text-gray-600">Med Conf</div>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                              <div className="font-semibold text-red-700">{result.confidence_summary.low_confidence_items}</div>
                              <div className="text-gray-600">Low Conf</div>
                            </div>
                          </div>
                          
                          {/* Overall Confidence */}
                          <div className="p-3 bg-blue-50 rounded-lg mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Overall Confidence:</span>
                              <Badge variant={result.confidence_summary.overall_confidence.score >= 85 ? 'success' : 'warning'}>
                                {result.confidence_summary.overall_confidence.score}%
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Send Button */}
                          {result.should_proceed && (
                            <Button
                              onClick={handleSendToJuniorEstimator}
                              className="w-full"
                              size="sm"
                            >
                              🍀 Send to Junior Leprechaun 🧙‍♂️
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {isProcessing && (
                <div className="mb-3 p-3 rounded-lg bg-white mr-12 shadow-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-3xl animate-pulse">🧙‍♂️</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 italic">Senior Estimator is thinking...</p>
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
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about materials, quantities, standards..."
                className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                size="sm"
              >
                Send
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Right Column - Issues/Questions Panel */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          {result && (
            <>
              {/* Takeoffs Summary */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  📋 Quantity Takeoffs
                  <Badge variant="default" className="text-xs">
                    {result.quote_items.length} items
                  </Badge>
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.quote_items.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-2 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-xs"
                      onClick={() => {
                        // Add to chat when clicked
                        const question = `Tell me more about: ${item.description}`;
                        setInputValue(question);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-gray-600 mt-0.5">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <Badge 
                          variant={item.confidence >= 85 ? 'success' : item.confidence >= 70 ? 'warning' : 'error'} 
                          className="text-xs ml-2"
                        >
                          {item.confidence}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              
              {/* Questions/Issues */}
              {result.questions && result.questions.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    ❓ Issues to Resolve
                    <Badge variant="warning" className="text-xs">
                      {result.questions.length} questions
                    </Badge>
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.questions.map((question, index) => (
                      <div 
                        key={index} 
                        className="p-3 border-l-4 border-yellow-400 bg-yellow-50 rounded hover:bg-yellow-100 cursor-pointer transition-colors"
                        onClick={() => {
                          // Add question to chat when clicked
                          setInputValue(question.question);
                        }}
                      >
                        <p className="text-sm font-medium text-yellow-900">{question.question}</p>
                        <p className="text-xs text-yellow-700 mt-1">{question.context}</p>
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {question.options.map((option, optIndex) => (
                              <button
                                key={optIndex}
                                className="px-2 py-0.5 text-xs bg-yellow-200 hover:bg-yellow-300 rounded transition-colors"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}