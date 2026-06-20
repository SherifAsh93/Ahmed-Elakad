import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getContent } from "@/lib/content";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    metadataBase: new URL("https://ahmedelakad.com"),
    title: {
      default: content.siteInfo?.brandName ?? "Ahmed Elakad Couture",
      template: `%s | ${content.siteInfo?.brandName ?? "Ahmed Elakad Couture"}`,
    },
    description: content.siteInfo?.description ?? "Ahmed Elakad Couture — Luxury fashion design.",
    other: { "google": "notranslate" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();

  return (
    <html lang="en" translate="no">
      <head>
        {/* Preconnect to font + Cloudinary origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Fonts loaded async via <link> instead of render-blocking CSS @import */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&family=Cinzel:wght@400;500&display=swap"
          media="print"
          // @ts-ignore — onload trick for async font loading without FOUT blocking
          onLoad="this.media='all'"
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <Navbar content={content} />
        <div className="flex-1">
          {children}
        </div>
        <Footer content={content} />
      </body>
    </html>
  );
}
