"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HighlightArea {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface PdfViewerProps {
  pdfUrl: string;
  highlightArea?: HighlightArea | null;
}

export default function PdfViewer({ pdfUrl, highlightArea }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // In a real implementation, we would use a PDF rendering library
  // For now, we'll display an iframe and overlay highlights
  return (
    <div ref={containerRef} className="relative h-full bg-background-secondary rounded-lg overflow-hidden">
      {/* PDF Display */}
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full h-full"
        title="PDF Preview"
      />

      {/* Highlight Overlay */}
      <AnimatePresence>
        {highlightArea && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute pointer-events-none"
            style={{
              left: `${highlightArea.x}%`,
              top: `${highlightArea.y}%`,
              width: `${highlightArea.width}%`,
              height: `${highlightArea.height}%`,
            }}
          >
            <div className="w-full h-full border-2 border-primary-light rounded bg-primary-light/10 animate-pulse">
              {highlightArea.label && (
                <div className="absolute -top-6 left-0 bg-primary-light text-white text-xs px-2 py-1 rounded">
                  {highlightArea.label}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback for demo - show a simulated PDF */}
      <div className="absolute inset-0 bg-white p-8 overflow-auto">
        <div className="max-w-3xl mx-auto text-black">
          <h1 className="text-2xl font-bold mb-4">CARPENTER PRO SUPPLIES</h1>
          <p className="text-sm mb-2">123 Wood Street, Craftville, CA 90210</p>
          <p className="text-sm mb-6">Phone: (555) 123-4567</p>
          
          <div className="mb-6">
            <p className="font-semibold">QUOTATION #Q-2024-0145</p>
            <p className="text-sm">Date: March 15, 2024</p>
          </div>

          <div className="mb-8">
            <p className="font-semibold mb-1">Bill To:</p>
            <p className="text-sm">John's Construction Co.</p>
            <p className="text-sm">456 Builder Lane</p>
            <p className="text-sm">Constructown, CA 90211</p>
          </div>

          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2">Item Description</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-center py-2">Unit</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2">2x4 Lumber - 8ft Premium Grade</td>
                <td className="text-center py-2">50</td>
                <td className="text-center py-2">pieces</td>
                <td className="text-right py-2">$8.99</td>
                <td className="text-right py-2">$449.50</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2">2x6 Lumber - 10ft</td>
                <td className="text-center py-2">30</td>
                <td className="text-center py-2">pieces</td>
                <td className="text-right py-2">$14.75</td>
                <td className="text-right py-2">$442.50</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2">Plywood Sheet - 4x8 3/4"</td>
                <td className="text-center py-2">20</td>
                <td className="text-center py-2">sheets</td>
                <td className="text-right py-2">$45.00</td>
                <td className="text-right py-2">$900.00</td>
              </tr>
            </tbody>
          </table>

          <div className="text-right">
            <p className="mb-1">Subtotal: $2,736.35</p>
            <p className="mb-1">Tax (8.25%): $225.75</p>
            <p className="font-bold text-lg">Total: $2,962.10</p>
          </div>
        </div>
      </div>
    </div>
  );
}