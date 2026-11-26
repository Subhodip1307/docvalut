"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return (
      <main className="flex-1 flex flex-col min-h-screen">{children}</main>
    );
  }

  return (
    <>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/20">
          {children}
        </main>
      </div>
    </>
  );
}
