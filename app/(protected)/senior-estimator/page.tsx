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
    setLiveUpdates(prev => [...prev, `[${timestamp}] ${message}`]);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            👷‍♂️ Senior Estimator
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze construction scope & drawings → Generate quantity takeoffs → Send to Junior Estimator
          </p>
        </div>
        <Badge variant="info" className="text-sm">
          NSW Construction Standards
        </Badge>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Scope & Settings */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Scope of Work</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Construction Scope</label>
                <textarea
                  value={scopeText}
                  onChange={(e) => setScopeText(e.target.value)}
                  placeholder="Describe the construction work... (e.g., 'Supply and install timber framing for residential extension, including posts, beams, and roof structure')"
                  className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as 'residential' | 'commercial' | 'industrial')}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="residential" className="bg-background text-foreground">Residential</option>
                    <option value="commercial" className="bg-background text-foreground">Commercial</option>
                    <option value="industrial" className="bg-background text-foreground">Industrial</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="NSW, Australia"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📐 Upload Drawings</h2>
            <FileDropZone 
              onFileUpload={handleFileUpload}
              attachedFiles={attachedFiles}
              onRemoveFile={handleRemoveFile}
            />
          </Card>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !scopeText.trim()}
            className="w-full h-12 text-lg font-semibold"
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin mr-2">⚙️</span>
                Analyzing Project...
              </>
            ) : (
              <>
                🔍 Analyze & Generate Takeoffs
              </>
            )}
          </Button>
        </div>

        {/* Middle Column - Results */}
        <div className="space-y-6 lg:col-span-1">
          {error && (
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 text-red-700">
                <span>❌</span>
                <span className="font-medium">Error</span>
              </div>
              <p className="mt-2 text-red-600">{error}</p>
            </Card>
          )}

          {result ? (
            <>
              {/* Confidence Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Analysis Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Overall Confidence</span>
                    <Badge variant={result.confidence_summary.overall_confidence.score >= 85 ? 'success' : 'warning'}>
                      {result.confidence_summary.overall_confidence.score}% {result.confidence_summary.overall_confidence.indicator}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600">🟢 High Confidence:</span>
                      <span className="ml-2 font-medium">{result.confidence_summary.high_confidence_items}</span>
                    </div>
                    <div>
                      <span className="text-yellow-600">🟡 Medium Confidence:</span>
                      <span className="ml-2 font-medium">{result.confidence_summary.medium_confidence_items}</span>
                    </div>
                    <div>
                      <span className="text-red-600">🔴 Low Confidence:</span>
                      <span className="ml-2 font-medium">{result.confidence_summary.low_confidence_items}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">❓ Needs Review:</span>
                      <span className="ml-2 font-medium">{result.confidence_summary.items_requiring_review}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quote Items */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">📋 Quantity Takeoffs</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {result.quote_items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <Badge variant={item.confidence >= 85 ? 'success' : 'warning'} className="text-xs">
                          {item.confidence}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Questions */}
              {result.questions.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">❓ Questions for Clarification</h3>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {result.questions.slice(0, 3).map((question, index) => (
                      <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                        <p className="text-sm font-medium">{question.question}</p>
                        <p className="text-xs text-gray-600 mt-1">{question.context}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Send to Junior Estimator */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">
                  🎯 Ready for Junior Estimator
                </h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Items Analyzed:</span>
                    <span className="font-medium">{result.quote_items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated Duration:</span>
                    <span className="font-medium">{result.estimated_duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ready to Proceed:</span>
                    <Badge variant={result.should_proceed ? 'success' : 'warning'}>
                      {result.should_proceed ? 'Yes' : 'Needs Review'}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendToJuniorEstimator}
                  className="w-full"
                  disabled={!result.should_proceed}
                >
                  📤 Send Takeoffs to Junior Estimator
                </Button>
                
                {!result.should_proceed && (
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Answer questions above before sending to Junior Estimator
                  </p>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-6">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">👷‍♂️</div>
                <p className="font-medium">Senior Estimator Ready</p>
                <p className="text-sm mt-2">
                  Enter scope and upload drawings to begin analysis
                </p>
              </div>
            </Card>
          )}
        </div>
        
        {/* Right Column - AI Chat & Live Updates */}
        <div className="space-y-6 lg:col-span-1">
          {/* Live Updates */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📡 Live Updates
            </h3>
            <div className="h-32 overflow-y-auto bg-gray-50 rounded-lg p-3 text-xs font-mono">
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
          
          {/* AI Chat Interface */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🤖 Ask Senior Estimator AI
            </h3>
            
            {/* Messages */}
            <div className="h-64 overflow-y-auto border rounded-lg p-3 mb-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">👷‍♂️</div>
                  <p className="text-sm">Ask me anything about your project!</p>
                  <p className="text-xs mt-1">e.g., &quot;What materials do I need?&quot; or &quot;How long will this take?&quot;</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-100 ml-8'
                        : 'bg-white mr-8 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm">
                        {message.role === 'user' ? '👤' : '👷‍♂️'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isProcessing && (
                <div className="mb-3 p-3 rounded-lg bg-white mr-8 shadow-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-sm animate-pulse">👷‍♂️</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 italic">Senior Estimator is thinking...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about materials, timeline, costs..."
                className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                size="sm"
              >
                {isProcessing ? (
                  <span className="animate-spin">⚙️</span>
                ) : (
                  '📤'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}