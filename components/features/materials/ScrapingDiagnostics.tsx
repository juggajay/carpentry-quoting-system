'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ScrapingDiagnostics() {
  const [url, setUrl] = useState('https://www.canterburytimbers.com.au/collections/timber-all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/diagnose-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: 'Failed to run diagnostics', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Scraping Diagnostics</h3>
      
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to diagnose"
          className="flex-1"
        />
        <Button onClick={runDiagnostics} disabled={loading || !url}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            'Run Diagnostics'
          )}
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          {/* Tests Results */}
          {results.tests && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              {results.tests.map((test: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-dark-surface rounded">
                  {test.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{test.name}</p>
                    {test.error && (
                      <p className="text-sm text-red-400">{test.error}</p>
                    )}
                    {test.duration && (
                      <p className="text-sm text-gray-400">Duration: {test.duration}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Platform Detection */}
          {results.platform && (
            <div className="p-3 bg-dark-surface rounded">
              <h4 className="font-medium mb-2">Platform Detection:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(results.platform).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span className={value ? 'text-green-400' : 'text-gray-500'}>
                      {value ? 'Yes' : 'No'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Protection Detection */}
          {results.protection && (
            <div className="p-3 bg-dark-surface rounded">
              <h4 className="font-medium mb-2">Protection Systems:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(results.protection).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span className={value ? 'text-amber-400' : 'text-gray-500'}>
                      {value ? 'Detected' : 'None'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="p-3 bg-amber-900/20 border border-amber-700 rounded">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Recommendations:
              </h4>
              <ul className="space-y-1">
                {results.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-amber-300">• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw JSON */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
              View Raw Response
            </summary>
            <pre className="mt-2 p-2 bg-dark-surface rounded text-xs overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </Card>
  );
}