"use client";

import type { ConfidenceLevel } from "@/lib/ai-assistant/types";

interface ConfidenceIndicatorProps {
  confidence: ConfidenceLevel;
  compact?: boolean;
  showScore?: boolean;
}

export default function ConfidenceIndicator({ 
  confidence, 
  compact = false,
  showScore = false 
}: ConfidenceIndicatorProps) {
  const getTooltipText = () => {
    if (confidence.reasons && confidence.reasons.length > 0) {
      return confidence.reasons.join(', ');
    }
    
    switch (confidence.indicator) {
      case '🟢':
        return 'High confidence - Item matched with high accuracy';
      case '🟡':
        return 'Medium confidence - Please verify details';
      case '🔴':
        return 'Low confidence - Manual review required';
      case '❓':
        return 'Needs clarification - Additional information required';
      default:
        return 'Confidence level';
    }
  };

  if (compact) {
    return (
      <span 
        className="text-lg cursor-help" 
        title={getTooltipText()}
      >
        {confidence.indicator}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{confidence.indicator}</span>
      {showScore && (
        <span className="text-sm text-muted-foreground">
          {confidence.score}%
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        {getTooltipText()}
      </span>
    </div>
  );
}