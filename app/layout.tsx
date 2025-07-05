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
      <html lang="en" className="bg-bg-primary" style={{ backgroundColor: '#0A0A0B' }}>
        <body 
          className="min-h-screen bg-bg-primary text-text-primary antialiased"
          style={{ 
            backgroundColor: '#0A0A0B', 
            color: '#FAFAFA',
            minHeight: '100vh' 
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            html, body {
              background-color: #0A0A0B !important;
              color: #FAFAFA !important;
            }
            .bg-bg-primary { background-color: #0A0A0B !important; }
            .bg-bg-secondary { background-color: #121214 !important; }
            .bg-bg-tertiary { background-color: #1A1A1D !important; }
            .text-text-primary { color: #FAFAFA !important; }
            .text-text-secondary { color: #A1A1AA !important; }
            .text-primary { color: #22C55E !important; }
            .bg-primary { background-color: #22C55E !important; }
            .border-border { border-color: #2A2A2E !important; }
          ` }} />
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
