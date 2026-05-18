import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/components/ThemeProvider";

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

const themeInitScript = `
  try {
    var storageKey = "theme";
    var storedTheme = localStorage.getItem(storageKey) || "system";
    var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var resolvedTheme = storedTheme === "system" ? systemTheme : storedTheme;
    var root = document.documentElement;
    root.classList.remove("dark");
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    }
    root.style.colorScheme = resolvedTheme;
  } catch (error) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="antialiased bg-surface text-on-surface flex min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
