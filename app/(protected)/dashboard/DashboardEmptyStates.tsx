"use client";

import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import { DocumentTextIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline";

export function EmptyQuotesState() {
  const router = useRouter();
  
  return (
    <EmptyState
      icon={<DocumentTextIcon />}
      title="No quotes yet"
      description="Create your first quote to get started"
      action={{
        label: "Create Quote",
        onClick: () => router.push("/quotes/new")
      }}
    />
  );
}

export function EmptyFilesState() {
  const router = useRouter();
  
  return (
    <EmptyState
      icon={<DocumentArrowUpIcon />}
      title="No files imported"
      description="Import PDF quotes to get started"
      action={{
        label: "Import PDF",
        onClick: () => router.push("/import")
      }}
    />
  );
}