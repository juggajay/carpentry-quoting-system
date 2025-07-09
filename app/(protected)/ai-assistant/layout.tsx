import { ErrorBoundary } from '@/components/error-boundary';

export default function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}