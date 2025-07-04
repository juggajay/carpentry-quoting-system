"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PdfViewer from "@/features/import/components/PdfViewer";
import VerificationForm from "@/features/import/components/VerificationForm";
import { saveVerifiedData } from "../../actions";

interface VerificationLayoutProps {
  file: any;
  extractedItems: any[];
}

export default function VerificationLayout({ file, extractedItems }: VerificationLayoutProps) {
  const router = useRouter();
  const [highlightArea, setHighlightArea] = useState<any>(null);

  const handleSave = async (items: any[], clientInfo: any) => {
    const result = await saveVerifiedData(file.id, items, clientInfo);
    if (result.success) {
      router.push("/quotes");
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          Verify Extracted Data
        </h1>
        <p className="text-text-secondary">
          Review and correct the extracted information before importing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        {/* PDF Viewer */}
        <div className="bg-background-card rounded-lg p-4 h-full">
          <PdfViewer pdfUrl={file.fileUrl} highlightArea={highlightArea} />
        </div>

        {/* Verification Form */}
        <div className="overflow-y-auto">
          <VerificationForm
            initialItems={extractedItems}
            onHighlight={setHighlightArea}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}