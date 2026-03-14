import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job Portal 2026 - Latest Govt Jobs, Admit Card, Results",
  description: "Official Job Portal website for latest government jobs, admit card, results, answer key, syllabus, and admission updates in India.",
  keywords: "job portal, govt jobs, latest jobs, admit card, results 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
