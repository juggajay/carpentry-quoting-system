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
            /* Background colors */
            .bg-bg-primary { background-color: #0A0A0B !important; }
            .bg-bg-secondary { background-color: #121214 !important; }
            .bg-bg-tertiary { background-color: #1A1A1D !important; }
            
            /* Text colors */
            .text-text-primary { color: #FAFAFA !important; }
            .text-text-secondary { color: #A1A1AA !important; }
            .text-text-tertiary { color: #71717A !important; }
            .text-text-muted { color: #71717A !important; }
            .text-primary { color: #22C55E !important; }
            .text-success { color: #10B981 !important; }
            .text-secondary { color: #3B82F6 !important; }
            .text-danger { color: #EF4444 !important; }
            .text-error { color: #EF4444 !important; }
            .text-warning { color: #F59E0B !important; }
            .text-text-inverse { color: #0A0A0B !important; }
            
            /* Background colors for elements */
            .bg-primary { background-color: #22C55E !important; }
            .bg-success { background-color: #10B981 !important; }
            .bg-secondary { background-color: #3B82F6 !important; }
            .bg-danger { background-color: #EF4444 !important; }
            .bg-error { background-color: #EF4444 !important; }
            .bg-warning { background-color: #F59E0B !important; }
            
            /* Opacity backgrounds */
            .bg-primary\\/10 { background-color: rgba(34, 197, 94, 0.1) !important; }
            .bg-success\\/10 { background-color: rgba(16, 185, 129, 0.1) !important; }
            .bg-secondary\\/10 { background-color: rgba(59, 130, 246, 0.1) !important; }
            .bg-red-500\\/20 { background-color: rgba(239, 68, 68, 0.2) !important; }
            
            /* Border colors */
            .border-border { border-color: #2A2A2E !important; }
            .border-border-hover { border-color: #3A3A3F !important; }
            .border-primary { border-color: #22C55E !important; }
            .border-primary\\/20 { border-color: rgba(34, 197, 94, 0.2) !important; }
            
            /* Hover states */
            .hover\\:bg-white\\/5:hover { background-color: rgba(255, 255, 255, 0.05) !important; }
            .hover\\:bg-bg-tertiary:hover { background-color: #1A1A1D !important; }
            .hover\\:bg-bg-tertiary\\/50:hover { background-color: rgba(26, 26, 29, 0.5) !important; }
            .hover\\:border-border-hover:hover { border-color: #3A3A3F !important; }
            .hover\\:text-text-primary:hover { color: #FAFAFA !important; }
            
            /* Status pill colors */
            .bg-status-draft-bg { background-color: rgba(113, 113, 122, 0.2) !important; }
            .text-status-draft-text { color: #71717A !important; }
            .bg-status-pending-bg { background-color: rgba(245, 158, 11, 0.2) !important; }
            .text-status-pending-text { color: #F59E0B !important; }
            .bg-status-approved-bg { background-color: rgba(34, 197, 94, 0.2) !important; }
            .text-status-approved-text { color: #22C55E !important; }
            .bg-status-rejected-bg { background-color: rgba(239, 68, 68, 0.2) !important; }
            .text-status-rejected-text { color: #EF4444 !important; }
            
            /* Other utilities */
            .shadow-card { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4) !important; }
            .shadow-card-hover { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important; }
            .rounded-lg { border-radius: 12px !important; }
            .rounded-full { border-radius: 9999px !important; }
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
