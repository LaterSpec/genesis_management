"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopAppBar from "./TopAppBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login");

  if (isAuthRoute) {
    return <main className="flex-1 flex flex-col min-h-screen relative">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen relative">
        <TopAppBar />
        <div className="p-8 space-y-8 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </>
  );
}
