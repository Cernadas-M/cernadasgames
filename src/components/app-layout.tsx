import type { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="lg:pl-60 pt-16">
        <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
