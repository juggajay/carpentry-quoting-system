import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface QuoteClipboardStore {
  items: QuoteItem[];
  addItems: (items: QuoteItem[]) => void;
  clearItems: () => void;
  getItemCount: () => number;
}

export const useQuoteClipboard = create<QuoteClipboardStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItems: (newItems) => {
        set({ items: newItems });
      },
      
      clearItems: () => {
        set({ items: [] });
      },
      
      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: "quote-clipboard",
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);