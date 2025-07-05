import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import UserSync from "@/components/UserSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carpentry Quoting System",
  description: "Professional quoting system for carpentry businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
          <QueryProvider>
            <UserSync>
              {children}
            </UserSync>
          </QueryProvider>
          <Toaster 
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
              },
              className: 'shadow-lg',
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
