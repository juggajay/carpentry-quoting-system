import { useState, useCallback, useRef, useEffect } from "react";
import { useDebounce } from "@/features/search/hooks/useDebounce";
import { saveQuote } from "../actions";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveProps {
  data: any;
  quoteId?: string;
  enabled?: boolean;
  delay?: number;
}

export function useAutoSave({
  data,
  quoteId,
  enabled = true,
  delay = 1000,
}: UseAutoSaveProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string | null>(null);

  const debouncedData = useDebounce(data, delay);

  const performSave = useCallback(async () => {
    if (!enabled || !quoteId) return;

    const dataString = JSON.stringify(debouncedData);
    
    // Skip if data hasn't changed
    if (dataString === lastSavedDataRef.current) {
      return;
    }

    setSaveStatus("saving");

    try {
      const result = await saveQuote(quoteId, debouncedData);
      
      if (result.success) {
        setSaveStatus("saved");
        lastSavedDataRef.current = dataString;
        
        // Reset to idle after 3 seconds
        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      setSaveStatus("error");
    }
  }, [debouncedData, enabled, quoteId]);

  // Trigger save when debounced data changes
  useEffect(() => {
    performSave();
  }, [performSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const triggerSave = useCallback(() => {
    setSaveStatus("idle");
  }, []);

  return {
    saveStatus,
    triggerSave,
  };
}