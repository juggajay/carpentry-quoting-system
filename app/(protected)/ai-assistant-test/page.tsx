'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AIAssistantTestPage() {
  const [testResults, setTestResults] = useState<{
    step: string;
    status: 'pending' | 'testing' | 'success' | 'error';
    message: string;
    details?: unknown;
  }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const addTestResult = (step: string, status: 'testing' | 'success' | 'error', message: string, details?: unknown) => {
    setTestResults(prev => {
      const newResults = [...prev];
      const existingIndex = newResults.findIndex(r => r.step === step);
      
      if (existingIndex >= 0) {
        newResults[existingIndex] = { step, status, message, details };
      } else {
        newResults.push({ step, status, message, details });
      }
      
      return newResults;
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Warning if no file selected
    if (!uploadedFile) {
      addTestResult('file-warning', 'error', 'No file selected! Please select a BOQ file (PDF, Excel, or CSV) before running tests.', null);
    }

    // Test 1: Check API endpoints
    addTestResult('api-health', 'testing', 'Checking API endpoints...');
    try {
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      addTestResult('api-health', 'success', 'API is healthy', healthData);
    } catch (error) {
      addTestResult('api-health', 'error', 'API health check failed', error);
    }

    // Test 2: Check authentication
    addTestResult('auth', 'testing', 'Checking authentication...');
    try {
      const response = await fetch('/api/debug-user');
      const userData = await response.json();
      if (userData.user) {
        addTestResult('auth', 'success', `Authenticated as ${userData.user.email}`, userData);
      } else {
        addTestResult('auth', 'error', 'Not authenticated', userData);
      }
    } catch (error) {
      addTestResult('auth', 'error', 'Authentication check failed', error);
    }

    // Test 3: Test file upload
    if (uploadedFile) {
      addTestResult('file-upload', 'testing', `Uploading ${uploadedFile.name}...`);
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const uploadResponse = await fetch('/api/ai-assistant/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        
        if (uploadResponse.ok) {
          addTestResult('file-upload', 'success', 'File uploaded successfully', uploadData);
        } else {
          addTestResult('file-upload', 'error', `Upload failed: ${uploadData.error}`, uploadData);
        }
      } catch (error) {
        addTestResult('file-upload', 'error', 'Upload request failed', error);
      }
    } else {
      addTestResult('file-upload', 'error', 'No file selected for testing', null);
    }

    // Test 4: Test chat endpoint
    addTestResult('chat', 'testing', 'Testing chat endpoint...');
    try {
      const chatResponse = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message - please respond with "OK"',
          attachments: []
        }),
      });

      const chatData = await chatResponse.json();
      
      if (chatResponse.ok) {
        addTestResult('chat', 'success', 'Chat endpoint working', chatData);
      } else {
        addTestResult('chat', 'error', `Chat failed: ${chatData.error}`, chatData);
      }
    } catch (error) {
      addTestResult('chat', 'error', 'Chat request failed', error);
    }

    // Test 5: Check OpenAI configuration and functionality
    addTestResult('openai', 'testing', 'Testing OpenAI configuration...');
    try {
      const openaiTestResponse = await fetch('/api/ai-assistant/test-openai');
      const openaiTestData = await openaiTestResponse.json();
      
      if (openaiTestResponse.ok) {
        addTestResult('openai', 
          openaiTestData.summary?.status === 'working' ? 'success' : 'error', 
          openaiTestData.summary?.message || 'OpenAI test completed', 
          openaiTestData
        );
      } else {
        addTestResult('openai', 'error', 'OpenAI test failed', openaiTestData);
      }
    } catch (error) {
      addTestResult('openai', 'error', 'OpenAI test failed', error);
    }

    // Test 6: Check AI Assistant status
    addTestResult('env', 'testing', 'Checking AI Assistant configuration...');
    try {
      const statusResponse = await fetch('/api/ai-assistant/status');
      const statusData = await statusResponse.json();
      
      if (statusResponse.ok) {
        const openAIConfigured = statusData.openai?.configured ? 'Yes' : 'No';
        const dbConfigured = statusData.database?.configured ? 'Yes' : 'No';
        
        addTestResult('env', 
          statusData.openai?.configured ? 'success' : 'error', 
          `OpenAI: ${openAIConfigured}, Database: ${dbConfigured}`, 
          statusData
        );
      } else {
        addTestResult('env', 'error', 'Status check failed', statusData);
      }
    } catch (error) {
      addTestResult('env', 'error', 'Status check failed', error);
    }

    // Test 7: Check MCP connections
    addTestResult('mcp', 'testing', 'Checking MCP connections...');
    try {
      const mcpResponse = await fetch('/api/mcp/connections');
      const mcpData = await mcpResponse.json();
      
      if (mcpResponse.ok) {
        addTestResult('mcp', 'success', `${mcpData.length} MCP connections found`, mcpData);
      } else {
        addTestResult('mcp', 'error', 'Failed to fetch MCP connections', mcpData);
      }
    } catch (error) {
      addTestResult('mcp', 'error', 'MCP check failed', error);
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'testing': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'testing': return '⏳';
      default: return '⏸️';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">AI Assistant Test Page</h1>
      <p className="text-muted-foreground">
        This page helps diagnose issues with the AI Assistant functionality.
      </p>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Select a Test File</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please select a BOQ file to test the upload and parsing functionality.
          </p>
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,.docx"
            onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-electric-magenta file:text-white
              hover:file:bg-electric-magenta/80"
          />
          {uploadedFile ? (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-500">
                ✅ File selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-500">
                ⚠️ No file selected - file upload test will be skipped
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Step 2: Run Diagnostic Tests</h2>
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="bg-electric-magenta hover:bg-electric-magenta/80"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-dark-elevated rounded-lg">
                <span className="text-xl">{getStatusIcon(result.status)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{result.step}</span>
                    <span className={`text-sm ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details !== undefined && result.details !== null && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-black/50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Manual Tests</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Browser Console</h3>
            <p className="text-sm text-muted-foreground">
              Open browser console (F12) and check for any JavaScript errors.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Network Tab</h3>
            <p className="text-sm text-muted-foreground">
              Open Network tab in browser DevTools and watch for failed requests when uploading files.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Expected Flow</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Select a BOQ file (PDF, Excel, or CSV)</li>
              <li>File uploads to /api/ai-assistant/upload</li>
              <li>Server extracts text content from file</li>
              <li>Type a message and send to chat</li>
              <li>Chat includes file content in AI prompt</li>
              <li>AI analyzes BOQ and responds with quote info</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}