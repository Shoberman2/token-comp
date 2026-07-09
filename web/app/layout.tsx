import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const display = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Burnt — daily AI token tracking",
  description:
    "Screenshot your AI token usage, post it once a day, and track your profile, company, models, and leaderboard stats.",
  applicationName: "Burnt",
  openGraph: {
    title: "Burnt",
    description: "Screenshot AI token usage. Post daily. Track models, profile stats, and leaderboards.",
    type: "website",
  },
  metadataBase: new URL("https://burnt.app"),
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        <div className="aurora" />
        <div className="grain" />
        <Nav />
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 md:pb-12">{children}</main>
      </body>
    </html>
  );
}
