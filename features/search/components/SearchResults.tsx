"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EyeIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import SkeletonCard from "@/components/ui/skeletons/SkeletonCard";

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  total: number;
  createdAt: string;
  client: {
    name: string;
  };
  _count: {
    items: number;
  };
}

interface SearchResultsProps {
  quotes: Quote[];
  isLoading: boolean;
  isError: boolean;
  onCopyItems: (quoteId: string) => void;
}

export default function SearchResults({
  quotes,
  isLoading,
  isError,
  onCopyItems,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error mb-2">Failed to load quotes</p>
          <p className="text-text-secondary text-sm">
            Please try again or check your connection
          </p>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-text-secondary mb-2">No quotes found</p>
            <p className="text-text-muted text-sm">
              Try adjusting your search criteria or filters
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotes.map((quote, index) => (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{quote.quoteNumber}</CardTitle>
                    <CardDescription>{quote.client.name}</CardDescription>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      quote.status === "DRAFT"
                        ? "bg-background-hover text-text-secondary"
                        : quote.status === "SENT"
                        ? "bg-info/10 text-info"
                        : quote.status === "ACCEPTED"
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error"
                    }`}
                  >
                    {quote.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {quote.title}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Items:</span>
                    <span className="text-text-primary">{quote._count.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted text-sm">Total:</span>
                    <span className="text-lg font-semibold text-text-primary">
                      ${quote.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border-default">
                  <span className="text-xs text-text-muted">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCopyItems(quote.id)}
                      title="Copy items to clipboard"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </Button>
                    <Link href={`/quotes/${quote.id}`}>
                      <Button size="sm" variant="secondary">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}