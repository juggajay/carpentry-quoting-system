'use client';

interface DebugIndicatorProps {
  status: string;
  color?: string;
}

export function DebugIndicator({ status, color = 'white' }: DebugIndicatorProps) {
  return (
    <div 
      className="fixed bottom-4 left-4 z-50 font-mono text-2xl font-bold animate-pulse"
      style={{ color }}
    >
      {status}
    </div>
  );
}