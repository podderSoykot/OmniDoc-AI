import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "OmniDoc-AI | Enterprise Document Intelligence",
  description: "AI-Powered Financial Document Extraction, Validation, and Cross-Verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
