'use client';

import { useEffect, useState, useRef } from 'react';

interface DebugLog {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
  details?: unknown;
}

interface DebugConsoleProps {
  isEnabled: boolean;
}

export const DebugConsole = ({ isEnabled }: DebugConsoleProps) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEnabled) return;

    // Create global debug logger
    interface WindowWithDebugLog extends Window {
      debugLog?: (type: DebugLog['type'], message: string, details?: unknown) => void;
    }
    
    (window as WindowWithDebugLog).debugLog = (type: DebugLog['type'], message: string, details?: unknown) => {
      const log: DebugLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        details
      };
      setLogs(prev => [...prev, log]);
      
      // Also log to regular console
      const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
      console[consoleMethod](`[DEBUG ${type.toUpperCase()}]`, message, details || '');
    };

    // Override console methods
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    };

    console.log = (...args) => {
      (window as WindowWithDebugLog).debugLog?.('info', args.join(' '));
      originalConsole.log(...args);
    };

    console.error = (...args) => {
      (window as WindowWithDebugLog).debugLog?.('error', args.join(' '));
      originalConsole.error(...args);
    };

    console.warn = (...args) => {
      (window as WindowWithDebugLog).debugLog?.('warning', args.join(' '));
      originalConsole.warn(...args);
    };

    // Log initial message
    (window as WindowWithDebugLog).debugLog?.('info', 'Debug mode enabled');

    return () => {
      // Restore original console methods
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      const windowWithDebug = window as WindowWithDebugLog;
      delete windowWithDebug.debugLog;
    };
  }, [isEnabled]);

  useEffect(() => {
    // Auto-scroll to bottom
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isEnabled) return null;

  const getLogColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  const getLogIcon = (type: DebugLog['type']) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-48' : 'w-96'} max-h-96 bg-black/95 border border-gray-700 rounded-lg shadow-2xl backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400 font-mono text-sm">Debug Console</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLogs([]);
            }}
            className="text-gray-400 hover:text-white text-xs"
          >
            Clear
          </button>
          <span className="text-gray-400">{isMinimized ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div className="overflow-y-auto max-h-80 p-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-4">Waiting for logs...</div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-gray-600">{log.timestamp}</span>
                  <span>{getLogIcon(log.type)}</span>
                  <div className={`flex-1 ${getLogColor(log.type)} break-all`}>
                    <div>{log.message}</div>
                    {log.details !== undefined && log.details !== null && (
                      <pre className="text-gray-500 mt-1 text-xs">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {!isMinimized && logs.length > 0 && (
        <div className="border-t border-gray-700 p-2 flex justify-between text-xs text-gray-500">
          <span>Total: {logs.length}</span>
          <span>
            Errors: {logs.filter(l => l.type === 'error').length} | 
            Warnings: {logs.filter(l => l.type === 'warning').length}
          </span>
        </div>
      )}
    </div>
  );
};

// Helper function for easier debug logging
export const debugLog = (type: 'info' | 'error' | 'warning' | 'success', message: string, details?: unknown) => {
  if (typeof window !== 'undefined') {
    interface WindowWithDebugLog extends Window {
      debugLog?: (type: 'info' | 'error' | 'warning' | 'success', message: string, details?: unknown) => void;
    }
    const windowWithDebug = window as WindowWithDebugLog;
    if (windowWithDebug.debugLog) {
      windowWithDebug.debugLog(type, message, details);
    }
  }
};