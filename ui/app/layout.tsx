import React, { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "DocVault",
  description: "Document Repository and Vault Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Suspense fallback={<div className="flex-1 min-h-screen" />}>
          <AppLayout>{children}</AppLayout>
        </Suspense>
      </body>
    </html>
  );
}
