'use client';

import { useEffect, useState } from 'react';

// Very simple debug display - just shows last 10 messages
export function SimpleDebug({ isEnabled }: { isEnabled: boolean }) {
  const [messages, setMessages] = useState<string[]>([]);
  
  useEffect(() => {
    if (!isEnabled) return;
    
    // Add debug function to window
    interface WindowWithDebug extends Window {
      simpleDebug?: (msg: string) => void;
    }
    (window as WindowWithDebug).simpleDebug = (msg: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const fullMsg = `${timestamp}: ${msg}`;
      console.log('[DEBUG]', fullMsg);
      setMessages(prev => [...prev.slice(-9), fullMsg]);
    };
    
    // Initial message
    (window as WindowWithDebug).simpleDebug?.('Debug enabled');
    
    return () => {
      delete (window as WindowWithDebug).simpleDebug;
    };
  }, [isEnabled]);
  
  if (!isEnabled || messages.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-green-400 p-4 rounded max-w-md font-mono text-xs">
      <div className="font-bold mb-2">DEBUG</div>
      {messages.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
    </div>
  );
}

// Helper to call debug safely
export function simpleLog(message: string) {
  if (typeof window !== 'undefined') {
    interface WindowWithDebug extends Window {
      simpleDebug?: (msg: string) => void;
    }
    (window as WindowWithDebug).simpleDebug?.(message);
  }
}