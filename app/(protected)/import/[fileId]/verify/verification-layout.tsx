"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PdfViewer from "@/features/import/components/PdfViewer";
import VerificationForm from "@/features/import/components/VerificationForm";
import { saveVerifiedData } from "../../actions";
import { UploadedFile } from "@prisma/client";

interface ExtractedItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface HighlightArea {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface ClientInfo {
  name: string;
  email?: string;
  phone?: string;
}

interface VerificationLayoutProps {
  file: UploadedFile;
  extractedItems: ExtractedItem[];
}

export default function VerificationLayout({ file, extractedItems }: VerificationLayoutProps) {
  const router = useRouter();
  const [highlightArea, setHighlightArea] = useState<HighlightArea | null>(null);

  const handleSave = async (items: ExtractedItem[], clientInfo: ClientInfo) => {
    const result = await saveVerifiedData(file.id, items, clientInfo);
    if (result.success) {
      router.push("/quotes");
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          Verify Extracted Data
        </h1>
        <p className="text-muted-foreground">
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