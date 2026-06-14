import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, AuthProvider } from "./providers";
import { Preloader } from "@/components/Preloader";

export const metadata: Metadata = {
  title: "Codemash | Unified Cross-Platform Coding Aggregator",
  description: "Search, aggregate, and bookmark coding problems across LeetCode, Codeforces, HackerRank, CodeChef, and GeeksforGeeks inside a beautiful, unified developer dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#F8E9E2] text-[#111111] transition-colors duration-300">
        <Preloader />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
