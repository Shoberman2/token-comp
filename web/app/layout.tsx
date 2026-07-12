import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { TokenMark } from "@/components/Logo";

const display = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const candidateHost =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "burnt.app";
  const host = /^[a-z0-9.-]+(?::\d+)?$/i.test(candidateHost) ? candidateHost : "burnt.app";
  const protocol = requestHeaders.get("x-forwarded-proto") === "http" ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const description =
    "Post your daily AI usage, share what you shipped with friends, keep your streak, and climb the leaderboard.";

  return {
    title: "Burnt — daily AI token tracking",
    description,
    applicationName: "Burnt",
    metadataBase: new URL(origin),
    openGraph: {
      title: "Burnt",
      description,
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Burnt — your daily AI tokens, shared" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Burnt",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#f6f6f7" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** Applies a saved explicit theme before first paint so there is no flash. */
const themeInit = `(function(){try{var t=localStorage.getItem("burnt-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <div className="aurora" />
        <div className="grain" />
        <Nav />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-7 md:pt-9">{children}</main>
        <footer className="mx-auto w-full max-w-2xl px-5 pb-[max(104px,env(safe-area-inset-bottom))] pt-16 md:pb-10">
          <div className="flex items-center justify-between border-t border-line pt-5 text-xs text-dim">
            <span className="inline-flex items-center gap-2 font-semibold text-fog">
              <TokenMark size={16} /> Burnt
            </span>
            <span>Daily AI token tracking</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
