import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
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
            {children}
          </QueryProvider>
          <Toaster 
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#1A1A1D',
                color: '#FAFAFA',
                border: '1px solid #2A2A2E',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
