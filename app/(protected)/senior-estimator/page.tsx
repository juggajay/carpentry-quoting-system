"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import FileDropZone from "../ai-assistant/components/FileDropZone";
import { Input } from "@/components/ui/Input";
import type { FileAttachment } from "@/lib/ai-assistant/types";

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

    try {
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

      if (response.ok && data.success) {
        setResult(data.results);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Senior Estimator error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
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

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Scope & Settings */}
        <div className="space-y-6">
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
                  <label className="block text-sm font-medium mb-2">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as 'residential' | 'commercial' | 'industrial')}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
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

        {/* Right Column - Results */}
        <div className="space-y-6">
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
      </div>
    </div>
  );
}