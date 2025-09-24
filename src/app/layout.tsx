import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import TopBanner from '@/components/TopBanner'
import Footer from '@/components/Footer'
import FloatingNav from '@/components/FloatingNav'

// Force recompilation

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SM-Survival Myanmar",
  description: "Watch your favorite movies and series with translations. High-quality content delivered through Telegram.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <TopBanner />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingNav />
        </Providers>
      </body>
    </html>
  );
}
