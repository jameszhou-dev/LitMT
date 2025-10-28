import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Controls the <title> across the site and in search previews
  title: {
    default: "LitMT",
    template: "%s | LitMT",
  },
  description: "LitMT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-indigo-100 to-white`}
      >
        {/* Global background wrapper to ensure gradient covers entire viewport */}
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
