"use client";

import { Button } from "@/components/ui/Button";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useQuoteClipboard } from "@/lib/store/quote-clipboard-store";
import { toast } from "sonner";

interface CopyToQuoteButtonProps {
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
}

export default function CopyToQuoteButton({ items }: CopyToQuoteButtonProps) {
  const { addItems, getItemCount } = useQuoteClipboard();
  const currentCount = getItemCount();

  const handleCopy = () => {
    if (items.length === 0) {
      toast.error("No items to copy");
      return;
    }

    addItems(items);
    toast.success(`${items.length} items copied to clipboard`);
  };

  return (
    <Button variant="secondary" onClick={handleCopy}>
      <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
      Copy to Quote
      {currentCount > 0 && (
        <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-light/20 text-primary-light rounded-full">
          {currentCount}
        </span>
      )}
    </Button>
  );
}