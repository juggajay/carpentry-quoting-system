import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import "./globals.css";
import "./test.css";

const inter = Inter({ subsets: ["latin"] });

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
      <html lang="en" data-theme="dark">
        <body className={`${inter.className} bg-dark-surface text-white`}>
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster 
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: 'var(--color-dark-elevated)',
                color: 'var(--color-clean-white)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}