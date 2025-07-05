import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import "./globals.css";

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
      <html lang="en">
        <body className={`${inter.className} bg-slate-950 text-white`}>
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster 
            position="top-right"
            theme="dark"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}