"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { exportSearchResults } from "../actions";

interface ExportButtonProps {
  filters: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
  };
  disabled?: boolean;
}

export default function ExportButton({ filters, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportSearchResults(filters);
      
      if (!result.success || !result.csv || !result.fileName) {
        throw new Error(result.error || "Export failed");
      }

      // Create blob and download
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", result.fileName);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export complete!");
    } catch (error) {
      toast.error("Failed to export results");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleExport}
      loading={isExporting}
      disabled={disabled || isExporting}
    >
      ↓ Export CSV
    </Button>
  );
}