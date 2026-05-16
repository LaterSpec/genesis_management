import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopAppBar from "@/components/layout/TopAppBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard - GenesisGym",
  description: "GenesisGym Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-surface text-on-surface flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-72 flex flex-col min-h-screen relative">
          <TopAppBar />
          <div className="p-8 space-y-8 flex-1 overflow-x-hidden">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
