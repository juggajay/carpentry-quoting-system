'use client';

import { useEffect, useState } from 'react';

interface DebugLog {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
}

interface DebugConsoleProps {
  isEnabled: boolean;
}

// Global logs array to store debug messages
let globalLogs: DebugLog[] = [];
let logListeners: ((logs: DebugLog[]) => void)[] = [];

export const DebugConsole = ({ isEnabled }: DebugConsoleProps) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Subscribe to log updates
    const listener = (newLogs: DebugLog[]) => {
      setLogs([...newLogs]);
    };
    
    logListeners.push(listener);
    setLogs([...globalLogs]); // Load existing logs
    
    return () => {
      logListeners = logListeners.filter(l => l !== listener);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  const getLogColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-blue-400';
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
              globalLogs = [];
              logListeners.forEach(listener => listener([]));
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
                  <div className={`flex-1 ${getLogColor(log.type)} break-all`}>
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Safe debug logging function - no console override
export const debugLog = (type: 'info' | 'error' | 'warning' | 'success', message: string, details?: unknown) => {
  const log: DebugLog = {
    id: Date.now().toString() + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    type,
    message: details ? `${message} ${JSON.stringify(details)}` : message
  };
  
  // Keep only last 100 logs to prevent memory issues
  globalLogs = [...globalLogs.slice(-99), log];
  
  // Notify all listeners
  logListeners.forEach(listener => listener(globalLogs));
  
  // Also log to real console for development
  const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
  console[consoleMethod](`[DEBUG ${type.toUpperCase()}]`, message, details || '');
};