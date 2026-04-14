import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "運命ナビ",
  description:
    "東洋・西洋の占術を統合して、あなただけの運勢・強み・人生の流れを教えてくれるアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="stars" />
        <Header />
        <main className="relative z-10 flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
